import { Request, Response } from "express";
import path from "path";
import { dbQueryWithFields } from "../services/db";
import * as logger from "../services/logger";
import * as xlsx from "xlsx";
import * as fs from "fs";
import { isAnyUndefined, responses } from "../services/common";
import { FieldInfo } from "mysql";
import dayjs from "dayjs";

type tableNames =
  | "paidsupple"
  | "printsupple"
  | "paidreval"
  | "printreval"
  | "paidcbt"
  | "printcbt"
  | "studentinfo"
  | "reportsupple"
  | "reportreval"
  | "reportcbt";

function convertToXLSX(
  result: any,
  fields: FieldInfo[],
  tableName: string,
  outFilePath = ""
): { path: string } | { error: string } {
  try {
    const data: any[][] = [];

    data.push(fields.map((field) => field.name)); // Add column headers
    result.forEach((row: any) => {
      data.push(Object.values(row));
    });

    // Create a new workbook
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const timestamp = Date.now();
    const excelFilePath = outFilePath || path.join("tmp", `${tableName}_${timestamp}.xlsx`);

    // Write the workbook to a file
    xlsx.writeFile(workbook, excelFilePath);
    return { path: excelFilePath };
  } catch (err) {
    logger.log(
      "error",
      "Error while creating xlsx file for table " + tableName,
      err
    );
    logger.log("warn", "This can be due to dir not present in required folder.", "\n Try running bin\\start.bat file");
    return { error: "Error while creating xlsx file" };
  }
}

export async function backupHandler(
  req:Request, res: Response
) {
  let result, fields: FieldInfo[];
  const usernameInToken = req.body.usernameInToken as string;
  const ip = req.ip as string;
  try {
    [result, fields] = (await dbQueryWithFields("SELECT * FROM studentinfo")) as [any, FieldInfo[]];
  } catch (err) {
    return res.status(500).json(responses.ErrorWhileDBRequest);
  }
  if (result.length <= 0) return res.json({ error: "No data found" });

  let out = convertToXLSX(result, fields, "studentinfo", path.join("backup", "backup.xlsx"));

  if ("error" in out) {
    return res.status(500).json(out);
  } else {
    logger.log('info', `${usernameInToken} from ip ${ip?.slice(7)} has created a backup`);
    return res.json(responses.DoneMSG);
  }
}

async function downloadTable(
  tableName: string,
  res: Response,
  fileNamePrefix: string,
  query: string
) {
  let result, fields: FieldInfo[];

  try {
    [result, fields] = (await dbQueryWithFields(query)) as [any, FieldInfo[]];
  } catch (err) {
    return res.status(500).json(responses.ErrorWhileDBRequest);
  }

  if (result.length <= 0) return res.json({ error: "No data found" });

  let out = convertToXLSX(result, fields, tableName);

  if ("error" in out) {
    return res.status(500).json(out);
  }

  const fileName = out.path;
  const downloadFileName = `${fileNamePrefix}.xlsx`;

  res.download(fileName, downloadFileName, (err) => {
    if (err) {
      logger.log("error", "Error downloading file:", err);
      return;
    }

    fs.unlink(fileName, (err) => {
      if (err) {
        logger.log("error", "Error deleting file:", err);
      }
    });
  });
}

const tables: {
  [key in tableNames]: { query: string; ordering: string; fileName: string };
} = {
  paidsupple: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt", user AS Registrant from paidsupply `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Registred Supple",
  },
  printsupple: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt", user AS Registrant FROM printsupply `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Unregistered Supple",
  },
  reportsupple: {
    query: `select subCode as Code, subName as Subject,count(*) as Total from paidsupply p `,
    ordering: " group by subCode,subName ORDER BY count(*) desc, subCode ",
    fileName: "Supple Report",
  },
  paidreval: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt", stat, user AS Registrant FROM paidreevaluation `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Registred Reval",
  },
  printreval: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt", stat, user AS Registrant FROM printreval `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Unregistered Reval",
  },
  reportreval: {
    query: `select subCode as "Code", subName as "Subject Name",count(*) as Total from paidreevaluation p group by subCode,subName `,
    ordering: " ORDER BY Total desc, subCode ",
    fileName: "Reval Report",
  },
  paidcbt: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM paidcbt `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Registred CBT",
  },
  reportcbt: {
    query: `select branch as Branch,subCode as Code,subName as Subject,count(*) as Total from paidcbt group by branch, subCode, subName, acYear,sem `,
    ordering: " ORDER BY Total desc, subCode ",
    fileName: "CBT Report",
  },
  printcbt: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM printCBT `,
    ordering: " ORDER BY rollNo, acYear, sem, subCode ",
    fileName: "Unregistred CBT",
  },
  studentinfo: {
    query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", grade AS "Grade", acYear AS "Year", sem AS "Semester", exYear AS "Exam Year", exMonth AS "Exam Month" FROM studentInfo `,
    ordering: " ORDER BY acYear, sem, subCode ",
    fileName: "Student Info",
  },
};
export async function downloadHandler(
  {
    query: { sem, acYear, tableName },
    body: { usernameInToken },
    ip
  }: { query: { sem: string; acYear: string; tableName: tableNames }, body: { usernameInToken: string}, ip?: string },
  res: Response
) {
  if (isAnyUndefined(tableName, sem, acYear)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  let condition =
    parseInt(acYear) !== 0 && parseInt(sem) !== 0
      ? ` WHERE acYear=${acYear} AND sem=${sem} `
      : "";
  if (tableName in tables) {
    const { query, ordering, fileName } = tables[tableName];
    await downloadTable(
      tableName,
      res,
      `${fileName}_${parseInt(acYear) !== 0 && parseInt(sem) !== 0
        ? "Complete"
        : `${acYear}-${sem}`
      }_${dayjs().format("DD-MMM-YY_hh-mm_A")}`,
      query + condition + ordering
    );
    logger.log('info', `${usernameInToken} from ip ${ip?.slice(7)} has downloaded ${tableName} table`);
  } else {
    // TODO: better msg
    res.status(400).json(responses.BadRequest);
  }
}

export async function manageDBdownloadHandler(
  { params, query, body:{usernameInToken}, ip }: Request,
  res: Response
) {
  const rollNo = params.rollNo as string;
  const tableName = query.tableName as tableNames;
  const acYear: number = parseInt(query.acYear as string);
  const sem: number = parseInt(query.sem as string);
  if (isAnyUndefined(rollNo, tableName, sem, acYear)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  let condition: string;
  if (acYear === 0 && sem === 0) condition = `WHERE rollNo = '${rollNo}' `;
  else if (acYear !== 0 && sem === 0)
    condition = `WHERE rollNo = '${rollNo}' AND acYear = ${acYear} `;
  else if (acYear !== 0 && sem !== 0)
    condition = `WHERE rollNo = '${rollNo}' AND acYear = ${acYear} and sem = ${sem} `;
  else {
    res.json({ error: responses.BadRequest });
    return;
  }
  if (tableName in tables) {
    const { query, ordering, fileName } = tables[tableName];
    await downloadTable(
      tableName,
      res,
      `${rollNo}_${fileName}_${dayjs().format("DD-MMM-YY_hh-mm_A")}`,
      query + condition + ordering
    );
    logger.log('info', `${usernameInToken} from ip ${ip?.slice(7)} has downloaded ${rollNo} info`);
  } else {
    res.status(400).json(responses.BadRequest);
  }
}
