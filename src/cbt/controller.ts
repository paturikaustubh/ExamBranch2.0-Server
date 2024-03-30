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

  if(isAnyUndefined(req.body.subjects)) return res.status(400).json(responses.NotAllParamsGiven);

  const { subCodes, subNames }: { subCodes: string[]; subNames: string[] } =
    req.body.subjects;
  const rollNo: string = req.params.rollNo;
  const branch: string = req.body.branch;
  const username: string = req.body.username;

  if (
    isAnyUndefined(acYear, sem, subCodes, subNames, branch, rollNo, username)
  ) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  try {
    await Promise.all(
      subCodes.map(async (subCode, index) => {
        await dbQuery(
          `INSERT IGNORE INTO ${tableName}(rollNo, subCode, acYear, sem, subName, regDate, branch, user) values ("${rollNo}","${subCode}","${acYear}","${sem}","${
            subNames[index]
          }", "${dayjs().format("DD MMM, YY")}","${branch}", "${username}")`
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
  const year = parseInt(req.body.acYear || 0);
  const sem = parseInt(req.body.sem || 0);
  try {
    if (year === 0 && sem === 0) {
      await dbQuery("TRUNCATE paidcbt");
      // await dbQuery("truncate cbtsubjects");
      res.send({ deleted: true });
      return;
    }
    let query = "DELETE FROM paidcbt where ";
    if (year !== 0) {
      query += `acYear = ${year}`;
    }
    if (sem !== 0) {
      if (year !== 0) query += " and ";
      query += `sem = ${sem}`;
    }
    await dbQuery(query);
  } catch (err) {
    logger.log("error", err);
    res.status(500).json({
      error:
        "Error occurred while processing the request. Check server logs for more information.",
    });
  }
}

export async function distBranchs(req: Request, res: Response) {
  const branch: string[] = [];
  const sem: string[] = [];
  const regYear: string[] = [];
  try {
    let result: any = await dbQuery(
      `SELECT DISTINCT branch, sem, regYear FROM cbtsubjects`
    );

    result.forEach((e: any) => {
      branch.push(e.branch);
      sem.push(e.sem);
      regYear.push(e.regYear);
    });
    res.send({ branch, sem, regYear });
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
  }
}
