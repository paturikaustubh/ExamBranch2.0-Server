import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import { Details, RevalRow } from "../interfaces/reval";
import dayjs from "dayjs";
import { isAnyUndefined, responses } from "../services/common";

// Revaluation Search

export async function revalSearch(req: Request, res: Response) {
  const rollNo: string = req.query.rollNo as string;
  const exMonth: number = parseInt(req.query.examMonth as string);
  const exYear: number = parseInt(req.query.examYear as string);
  let subjects: Details = {};

  if (isAnyUndefined(rollNo, exMonth, exYear)) {
    res.status(400).json({ error: responses.NotAllParamsGiven });
    return;
  }

  let subjDetails: { subCodes: string[]; subNames: string[] }[] = [];
  try {
    const result = (await dbQuery(
      `SELECT subCode, subName FROM printReval WHERE rollNo = '${rollNo}';`
    )) as RevalRow[];
    // Checking whether the std is already in the print table for registration otherwise fetching std details from the studentInfo table which are not paid
    const query: string =
      result.length > 0
        ? `SELECT subCode, subName FROM printReval WHERE rollNo = ? AND acYear = ? AND sem = ?`
        : `SELECT std.subCode, std.subName FROM studentInfo std LEFT JOIN paidReEvaluation paidStd ON std.subCode = paidStd.subCode AND std.rollNo = paidStd.rollNo WHERE std.rollNo = ? AND std.exMonth = ${exMonth} AND std.exYear = ${exYear} AND std.acYear = ? AND std.sem = ? AND paidStd.subCode IS NULL AND paidStd.rollNo IS NULL`;
    let year: number = 1,
      sem: number = 1;
    for (let i = 0; i < 8; i++) {
      const result: any = (await dbQuery(query, [
        rollNo,
        year,
        sem,
      ])) as RevalRow[];
      let subCodes: string[] = [];
      let subNames: string[] = [];
      result.forEach((val: { subCode: string; subName: string }) => {
        subCodes.push(val.subCode);
        subNames.push(val.subName);
      });
      year = i & 1 ? ++year : year;
      sem = sem == 1 ? 2 : 1;
      subjDetails.push({ subCodes: subCodes, subNames: subNames });
    }
    subjDetails.forEach((subjDetails, index) => {
      const semCode = String.fromCharCode("A".charCodeAt(0) + index);
      subjects[semCode] = subjDetails;
    });
    res.json({ subjects, printTableExist: result.length > 0 });
  } catch (err) {
    logger.log("error", err);
    res.json({ error: responses.ErrorWhileDBRequest });
  }
}

// Common function for Paid and Register

async function revalProcess(req: Request, reg?: string) {
  const { body, params } = req;
  const { rollNo } = params;
  const { username, selectedSubjects } = body;
  const details = [
    selectedSubjects.A,
    selectedSubjects.B,
    selectedSubjects.C,
    selectedSubjects.D,
    selectedSubjects.E,
    selectedSubjects.F,
    selectedSubjects.G,
    selectedSubjects.H,
  ];
  let year: number = 1,
    sem: number = 1,
    semCode: string = "A";

  if (isAnyUndefined(rollNo, username, ...details)) {
    throw responses.NotAllParamsGiven;
  }
  const date = dayjs().format("DD-MMM-YY");
  for (const subjects of details) {
    for (let i = 0; i < subjects.subCodes.length; i++) {
      try {
        const [subCode, subName] = [subjects.subCodes[i], subjects.subNames[i]];
        reg === undefined
          ? await dbQuery(
              `INSERT IGNORE INTO printReval (rollNo, subCode, subName, acYear, sem, user, regDate) VALUES ('${rollNo}', '${subCode}', '${subName}', ${year}, ${sem}, '${username}', '${date}')`
            )
          : await dbQuery(
              `INSERT IGNORE INTO paidReEvaluation (rollNo, subCode, subName, acYear, sem, user, stat, regDate) VALUES ('${rollNo}', '${subCode}', '${subName}', '${year}', '${sem}', '${username}', '${
                reg === semCode ? "R" : ""
              }', '${date}')`
            );
      } catch (err) {
        logger.log("error", err);
        throw responses.ErrorWhileDBRequestWithDone;
      }
    }
    sem = sem === 1 ? 2 : 1;
    year = sem === 1 ? ++year : year;
    semCode = String.fromCharCode(semCode.charCodeAt(0) + 1);
  }
}

// Inserting std into printReval Table

export async function printReval(req: Request, res: Response) {
  try {
    await revalProcess(req);
  } catch (err) {
    logger.log("error", err);
    return res.json({ error: responses.ErrorWhileDBRequestWithDone });
  }
  return res.json({ done: true });
}

// Inserting std into paidReEvaluation table and Deleting std from the printReval table

export async function registerReval(req: Request, res: Response) {
  const rollNo = req.params.rollNo;
  const { regular, amount } = req.body;
  if (isAnyUndefined(rollNo, regular)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await revalProcess(req, regular);
    await dbQuery(`DELETE FROM printReval WHERE rollNo = '${rollNo}'`);
  } catch (err) {
    logger.log("error", err);
    return res.json({ error: responses.ErrorWhileDBRequestWithDone });
  }
  return res.json({ done: true });
}
