import * as xlsx from "xlsx";
import { Request, Response, response } from "express";
import path from "path";
import { promises as fs } from "fs";

import dbQuery from "../services/db";
import * as logger from "../services/logger";
import { isAnyUndefined, responses } from "../services/common";

const supportedExtensions = [".xlsx", ".csv"];
const tables = {
  paidsupple: "paidsupply",
  printsupple: "printsupply",
  paidreval: "paidreevaluation",
  printreval: "printreval",
  paidcbt: "paidcbt",
  printcbt: "printcbt",
  codenames: "codenames",
} as any;

function findKey(object: any, key: string) {
  for (const k of Object.keys(object))
    if (k.toLowerCase() === key.toLowerCase()) return object[k];

  throw `${key} not found in sheet`;
}

function processCSV(data: string) {
  return data
    .trim()
    .split("\n")
    .map((row) =>
      row
        .trim()
        .split(",")
        .map((row) => (row ? `'${row}'` : "NULL"))
    )
    .map((row) => `(${row})`);
}

async function uploadFromLoc(location: string, tableName: string) {
  let response: { message: string };
  try {
    const workbook = xlsx.readFile(location);
    const sheet_name = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_csv(workbook.Sheets[sheet_name]);
    const rows = processCSV(data);

    // Seperate headers and values
    let [_header, ...values] = rows;

    try {
      const value = await dbQuery(
        `INSERT IGNORE INTO ${tableName} VALUES ${values}`
      );
      logger.log("info", `Restoring ${tableName} done! \nWith result:`, value);
    } catch (err) {
      logger.log(
        "error",
        `Restoring ${tableName} falied error inserting data into MySQL:`,
        err
      );
      return responses.ErrorWhileDBRequest;
    }
  } catch (err) {
    logger.log("error", "Error reading file:", err);
    return responses.ErrorWhileReadingOrProcessing;
  }
  return responses.DoneMSG;
}

async function uploadAllFilesInDir(
  loc: string,
  ext: string,
  tableName: string
) {
  try {
    let errFile: string[] = [],
      totalMatchFiles = 0,
      uplodedFiles: string[] = [];
    // Read the contents of the directory
    const files = await fs.readdir(loc);

    // Iterate through the files in the directory
    for (const file of files) {
      // Construct the full path of the file
      const filePath = path.join(loc, file);
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        continue;
      }
      const fileExtension = path.extname(filePath);

      // Check if the file extension matches the target extension
      if (fileExtension !== ext) {
        continue;
      }
      totalMatchFiles++;

      let result = await uploadFromLoc(filePath, tableName);

      if ("error" in result) {
        errFile.push(filePath);
      } else {
        uplodedFiles.push(filePath);
      }
    }
    return {
      done: true,
      totalMatchFiles: totalMatchFiles,
      totalErrorFile: errFile.length,
      errFile,
      uplodedFiles,
    };
  } catch (err) {
    logger.log("error", "Error reading directory:", err);
    return { done: false, error: "Error while reading the dir" };
  }
}

export async function restoreStudentInfo(
  { body: { usernameInToken, loc }, ip }: Request,
  res: Response
) {
  loc = path.join(loc.trim());

  if (isAnyUndefined(loc))
    return res.status(400).json(responses.NotAllParamsGiven);

  for (const ext of supportedExtensions) {
    let r = await uploadFromLoc(path.join(loc, `backup${ext}`), "studentinfo");
    if (!("error" in r)) {
      logger.log("info", "Restoring studentinfo Done");
      logger.log(
        "info",
        `${usernameInToken} from ip ${ip?.slice(7)} has restored studentinfo`
      );
      return res.json(responses.DoneMSG);
    }
  }

  res.json(responses.ErrorWhileReadingOrProcessing);
}

export async function uploadHandler(
  { body: { ext, loc, usernameInToken }, ip, params: { tableName } }: Request,
  res: Response
) {
  ext = ext || ".xlsx";
  loc = loc.trim();
  if (isAnyUndefined(loc, ext))
    return res.status(400).json(responses.NotAllParamsGiven);

  if (!(tableName in tables))
    return res.status(404).json(responses.PageNotFound);
  if (!supportedExtensions.includes(ext))
    return res.status(400).json(responses.UnsupportedFileExt);

  const stat = await uploadAllFilesInDir(loc, ext, tables[tableName]);
  if ("error" in stat) {
    res.status(500);
  } else {
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(
        7
      )} has uploded into ${tableName} table`
    );
  }
  res.json(stat);
}

export async function uploadStudentInfo(
  {
    body: { acYear, sem, exYear, exMonth, ext, loc, usernameInToken },
    params: { tableName },
    ip,
  }: Request,
  res: Response
) {
  ext = ext || ".xlsx";

  if (isAnyUndefined(loc, ext, acYear, sem, exYear, exMonth)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  loc = loc.trim();

  if (!supportedExtensions.includes(ext))
    return res.status(400).json(responses.UnsupportedFileExt);

  let data: any[] = [];
  try {
    const workbook = xlsx.readFile(path.join(loc, `studentinfo${ext}`));

    for (const sheet_name of workbook.SheetNames)
      data = data.concat(xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]));
  } catch (err) {
    logger.log(
      "error",
      `Uploading into ${tableName} falied: Error reading or process from the file`,
      err
    );
    return res.json(responses.ErrorWhileReadingOrProcessing);
  }

  try {
    const insertQuery = `replace into studentinfo (select ?, ?, subName, ?,${acYear},${sem},${exYear},${exMonth} from codeNames where subCode=? limit 1)`;

    await Promise.all(
      data.map(async (student) => {
        const rollNo = student["rollNo"];
        delete student["rollNo"];
        for (let subCode in student)
          await dbQuery(insertQuery, [
            rollNo,
            subCode,
            student[subCode],
            subCode,
          ]);

        // await Promise.all(
        //     subjects.forEach(async (row, index) => {
        //         await dbQuery(insertQuery, [rollNo, header[index], ]);
        //     })
        // );
      })
    );
    logger.log("info", "Results uploded into studentinfo successfully");
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(
        7
      )} has uploded into studentinfo table`
    );
    res.json(responses.DoneMSG);
  } catch (err) {
    logger.log(
      "error",
      `Uploading into studentinfo falied error inserting data into MySQL:`,
      err
    );
    res.json(responses.ErrorWhileDBRequest);
  }
}

export async function uploadCBTSubjects(
  { body: { loc, ext, acYear, sem, regYear, usernameInToken }, ip }: Request,
  res: Response
) {
  ext = ext ?? ".xlsx";
  if (isAnyUndefined(loc, acYear, sem, regYear)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  loc = loc.trim();

  if (!supportedExtensions.includes(ext))
    return res.status(400).json(responses.UnsupportedFileExt);

  let data: any[] = [];
  try {
    const workbook = xlsx.readFile(path.join(loc, `cbtsubjects${ext}`));

    for (const sheet_name of workbook.SheetNames)
      data = data.concat(xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name]));
  } catch (err) {
    logger.log(
      "error",
      `Uploading into studentinfo falied: Error reading or process from the file`,
      err
    );
    return res.json(responses.ErrorWhileReadingOrProcessing);
  }
  try {
    const insertQuery = `INSERT IGNORE into cbtsubjects (subCode, subName, branch, acYear, sem, regYear) values(?, ? , ?, ${acYear}, ${sem}, ${regYear})`;

    await Promise.all(
      data.map(async (subject) => {
        await dbQuery(insertQuery, [
          findKey(subject, "subCode"),
          findKey(subject, "subName"),
          findKey(subject, "branch"),
        ]);

        // await Promise.all(
        //     subjects.forEach(async (row, index) => {
        //         await dbQuery(insertQuery, [rollNo, header[index], ]);
        //     })
        // );
      })
    );
    logger.log("info", "Results uploded into cbtsubjects successfully");
    logger.log(
      "info",
      `${usernameInToken} from ip ${ip?.slice(
        7
      )} has uploded into cbtsubjects table`
    );
    res.json(responses.DoneMSG);
  } catch (err) {
    logger.log(
      "error",
      `Uploading into cbtsubjects falied error inserting data into MySQL:`,
      err
    );
    res.json(responses.ErrorWhileDBRequest);
  }
}
