import { Request, Response } from "express";

import dbQuery from "../services/db";
import * as logger from "../services/logger";
import { isAnyUndefined, responses } from "../services/common";
import { CBTSubjectsRow, PrintCBTRow } from "../interfaces/cbt";
import dayjs from "dayjs";
import { StudentInfo } from "../interfaces/supply";

export async function searchCBT(req: Request, res: Response) {
  const acYear = req.query.acYear;
  const sem = req.query.sem;
  const reg = req.query.reg;
  const branch = req.query.branch;
  const rollNo = req.query.rollNo;

  if (isAnyUndefined(acYear, sem, reg, branch, rollNo)) {
    res.status(400).json({
      //TODO: better error msg
      error: "Not all parms given",
    });
    return;
  }
  const subCodes: string[] = [];
  const subNames: string[] = [];
  try {
    let rowsInStudentInfo = (await dbQuery(
      `SELECT * FROM studentinfo WHERE rollNo = '${rollNo}' limit 1`
    )) as StudentInfo[];
    if (rowsInStudentInfo.length == 0)
      return res.status(400).json({
        error: "Enter a valid rollNo",
      });

    let rowsInPrintTable = (await dbQuery(
      `SELECT * FROM printcbt WHERE rollNo='${rollNo}' and acYear= ${acYear} and sem = ${sem}`
    )) as PrintCBTRow[];
    let printTableExist: boolean = rowsInPrintTable.length > 0;

    let query = printTableExist
      ? `SELECT subCode, subName FROM printcbt WHERE rollNo="${rollNo}"`
      : `SELECT t.subCode,t.subName FROM cbtsubjects t Left join paidcbt p on t.subCode=p.subCode and p.rollNo="${rollNo}" WHERE t.acYear=${acYear} and t.sem=${sem} and p.subCode is null and t.regYear=${reg} and t.branch="${branch}"`;

    let cbtSubjectsTable = (await dbQuery(query)) as CBTSubjectsRow[];

    cbtSubjectsTable.forEach((e) => {
      subCodes.push(e.subCode);
      subNames.push(e.subName);
    });
    res.send({ subCodes, subNames, printTableExist });
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}

async function processCBT(req: Request, res: Response, tableName: string) {
  const acYear: number = req.body.acYear;
  const sem: number = req.body.sem;

  if (isAnyUndefined(req.body.subjects))
    return res.status(400).json(responses.NotAllParamsGiven);

  const { subCodes, subNames }: { subCodes: string[]; subNames: string[] } =
    req.body.subjects;
  const rollNo: string = req.params.rollNo;
  const branch: string = req.body.branch;
  const username: string = req.body.username;
  const grandTotal: number = req.body.grandTotal;

  if (
    isAnyUndefined(
      acYear,
      sem,
      subCodes,
      subNames,
      branch,
      rollNo,
      username,
      grandTotal
    )
  ) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  try {
    await Promise.all(
      subCodes.map(async (subCode, index) => {
        await dbQuery(
          `INSERT IGNORE INTO ${tableName}(rollNo, subCode, acYear, sem, subName, regDate, branch, user, grandTotal) values ("${rollNo}","${subCode}","${acYear}","${sem}","${
            subNames[index]
          }", "${dayjs().format(
            "DD MMM, YY"
          )}","${branch}", "${username}", ${grandTotal})`
        );
      })
    );
    if (tableName === "paidcbt")
      await dbQuery(`DELETE FROM printcbt WHERE rollNo = "${rollNo}"`);
    logger.log("info", `${username} add rollNo: ${rollNo} to ${tableName} `);
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}

export async function printCBT(req: Request, res: Response) {
  await processCBT(req, res, "printcbt");
}

export async function paidCBT(req: Request, res: Response) {
  await processCBT(req, res, "paidcbt");
}

export async function deleteFromCBT(req: Request, res: Response) {
  const year: number = parseInt(req.query.acYear as string);
  const sem: number = parseInt(req.query.sem as string);
  try {
    if (year === 0 && sem === 0) {
      await dbQuery("TRUNCATE paidcbt");
      await dbQuery("TRUNCATE printcbt");
      await dbQuery("TRUNCATE cbtsubjects");
      res.send(responses.DoneMSG);
      return;
    }
    let paidCbtDelete = "DELETE FROM paidcbt where ";
    if (year !== 0) {
      paidCbtDelete += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) paidCbtDelete += " and ";
      paidCbtDelete += `sem = ${sem}`;
    }
    let printCbtDelete = "DELETE FROM paidcbt where ";
    if (year !== 0) {
      printCbtDelete += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) printCbtDelete += " and ";
      printCbtDelete += `sem = ${sem}`;
    }
    let cbtSubsDelete = "DELETE FROM paidcbt where ";
    if (year !== 0) {
      cbtSubsDelete += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) cbtSubsDelete += " and ";
      cbtSubsDelete += `sem = ${sem}`;
    }
    await dbQuery(paidCbtDelete);
    await dbQuery(printCbtDelete);
    await dbQuery(cbtSubsDelete);
    res.send(responses.DoneMSG);
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}

export async function distBranchs(req: Request, res: Response) {
  const branch: string[] = [];
  const sem: string[] = [];
  const acYear: string[] = [];
  try {
    let branchResult: any = await dbQuery(
      `SELECT DISTINCT branch FROM cbtsubjects`
    );
    let yearResult: any = await dbQuery(
      `SELECT DISTINCT acYear FROM cbtsubjects`
    );
    let semResult: any = await dbQuery(`SELECT DISTINCT sem FROM cbtsubjects`);
    console.log(branchResult, yearResult, semResult);

    branchResult.forEach((e: any) => {
      branch.push(e.branch);
    });
    yearResult.forEach((e: any) => {
      acYear.push(e.acYear);
    });
    semResult.forEach((e: any) => {
      sem.push(e.sem);
    });
    console.log(acYear);
    res.send({ branch, sem, acYear });
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}
