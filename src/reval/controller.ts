import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import {
  Details,
  RevalRow,
  RevalTable,
  SubjectDetails,
} from "../interfaces/reval";
import dayjs from "dayjs";
import { isAnyUndefined, responses } from "../services/common";
import { printCBT } from "../cbt/controller";

// ANCHOR Revaluation Search

export async function revalSearch(req: Request, res: Response) {
  const rollNo: string = req.query.rollNo as string;
  const exMonth: number = parseInt(req.query.exMonth as string);
  const exYear: number = parseInt(req.query.exYear as string);
  if (isAnyUndefined(rollNo, exMonth, exYear)) {
    res.status(400).json(responses.NotAllParamsGiven);
    return;
  }
  let subjects: Details = {};
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
      sem: number = 1,
      semCode: string = "A";
    // Fetching Subjects from the table
    for (let i = 0; i < 8; i++) {
      const result = (await dbQuery(query, [rollNo, year, sem])) as RevalRow[];
      let subCodes: string[] = [];
      let subNames: string[] = [];
      result.forEach((val: { subCode: string; subName: string }) => {
        subCodes.push(val.subCode);
        subNames.push(val.subName);
      });
      year = i & 1 ? ++year : year;
      sem = sem == 1 ? 2 : 1;
      subjects[semCode] = { subCodes: subCodes, subNames: subNames };
      semCode = String.fromCharCode(semCode.charCodeAt(0) + 1);
    }
    res.json({ subjects, printTableExist: result.length > 0 });
  } catch (err) {
    logger.log("error", err);
    res.json(responses.ErrorWhileDBRequest);
  }
}

// ANCHOR Common function for Print and Register(Paid)

async function revalProcess(req: Request, isPaidTable: boolean) {
  const { body, params } = req;
  if (isAnyUndefined(body.subjects)) {
    throw responses.BadRequest;
  }
  const { rollNo } = params;
  const ip = req.ip;
  const { username, subjects, grandTotal, regular } = body;
  const details = [
    subjects.A,
    subjects.B,
    subjects.C,
    subjects.D,
    subjects.E,
    subjects.F,
    subjects.G,
    subjects.H,
  ] as SubjectDetails[];
  if (isAnyUndefined(rollNo, username, ...details)) {
    throw responses.NotAllParamsGiven;
  }
  const tableName: string = isPaidTable ? "paidReEvaluation" : "printReval";
  let year: number = 1,
    sem: number = 1,
    semCode: string = "A";
  if (isAnyUndefined(rollNo, username, ...details)) {
    throw responses.NotAllParamsGiven;
  }
  let rows =[] ;
  const date = dayjs().format("DD MMM, YY");
  for (const subjects of details) {
    for (let i = 0; i < subjects.subCodes.length; i++) {
      const [subCode, subName] = [subjects.subCodes[i], subjects.subNames[i]];
      rows.push([
        rollNo,
        subCode,
        subName,
        year,
        sem,
        date,
        regular === semCode ? "R" : "",
        username,
        grandTotal as number,
      ]);
    }
    sem = sem === 1 ? 2 : 1;
    year = sem === 1 ? ++year : year;
    semCode = String.fromCharCode(semCode.charCodeAt(0) + 1);
  }
  try {
    await dbQuery(
      `INSERT IGNORE INTO ${tableName} (rollNo, subCode, subName, acYear, sem, regDate, stat, user, grandTotal) VALUES ?`,
      [rows]
    );
    if (isPaidTable)
      await dbQuery(`DELETE FROM printReval WHERE rollNo = '${rollNo}'`);
    logger.log(
      `info`,
      `${
        req.body.usernameInToken
      } has added ${rollNo} details in ${tableName} on IP ${ip?.slice(7)}`
    );
  } catch (err) {
    logger.log("error", err);
    throw responses.ErrorWhileDBRequest;
  }
}

// ANCHOR Inserting std details into printReval Table

export async function printReval(req: Request, res: Response) {
  try {
    await revalProcess(req, false);
  } catch (err) {
    logger.log("error", err);
    return res.json(err);
  }
  return res.json({ done: true });
}

// ANCHOR Inserting std details into paidReEvaluation table and Deleting std from the printReval table

export async function registerReval(req: Request, res: Response) {
  const rollNo: string = req.params.rollNo;
  try {
    await revalProcess(req, true);
    await dbQuery(`DELETE FROM printReval WHERE rollNo = '${rollNo}'`);
  } catch (err) {
    logger.log("error", err);
    return res.json(err);
  }
  return res.json({ done: true });
}

export async function deleteFromReval(req: Request, res: Response) {
  let year = parseInt(req.query.acYear as string) as number;
  let sem = parseInt(req.query.sem as string) as number;
  try {
    if (year === 0 && sem === 0) {
      await dbQuery("TRUNCATE paidReEvaluation");
      await dbQuery("TRUNCATE printReval");
      res.send(responses.DoneMSG);
      return;
    }

    let paidRevalDelete: string = "DELETE FROM paidReEvaluation where ";
    if (year !== 0) {
      paidRevalDelete += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) paidRevalDelete += " and ";
      paidRevalDelete += `sem = ${sem}`;
    }

    let printRevalDelete: string = "DELETE FROM printReval where ";
    if (year !== 0) {
      printRevalDelete += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) printRevalDelete += " and ";
      printRevalDelete += `sem = ${sem}`;
    }
    await dbQuery(paidRevalDelete);
    await dbQuery(printRevalDelete);
    logger.log(
      `info`,
      `${
        req.body.usernameInToken
      } has deleted paidReEvaluation on IP ${req.ip?.slice(7)}`
    );
    res.json(responses.DoneMSG);
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}
