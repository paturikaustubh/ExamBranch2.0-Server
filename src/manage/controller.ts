import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import dayjs from "dayjs";
import { isAnyUndefined, responses } from "../services/common";
import md5 from "md5";
import { Acyear, Sem, SubNames } from "../interfaces/manage";

// Below are the common functionalites for studentInfo, Print and Paid entries

// Getting Student Details

export async function getStdDetails(req: Request, res: Response) {
  const { query } = req;
  const { rollNo, tableName } = query;
  if (isAnyUndefined(rollNo, tableName)) {
    res.status(400).json(responses.NotAllParamsGiven);
    return;
  }
  try {
    let stdData: any = await dbQuery(
      `SELECT * FROM ${tableName} WHERE rollNo = '${rollNo}' ORDER BY acYear ASC, sem ASC, subCode ASC`
    );
    stdData = JSON.parse(JSON.stringify(stdData));
    res.json({ stdData });
  } catch (err) {
    logger.log("error", err);
    res.json({ error: responses.ErrorWhileDBRequest });
  }
}

// Editing Student Details

export async function editStdDetails(req: Request, res: Response) {
  const rollNo: string = req.params.rollNo;
  const acYear: number = parseInt(req.body.acYear) as Acyear;
  const sem: number = parseInt(req.body.sem) as Sem;
  const tableName: string = req.body.tableName;
  const subCode: string = req.body.subCode;
  const newSubCode: string = req.body.newSubCode;
  const username: string = req.body.username;

  if (isAnyUndefined(rollNo, acYear, sem, tableName, subCode, newSubCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    let result = (await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${newSubCode}'`
    )) as SubNames[];
    if (result.length === 0) return res.json({ error: "Invalid Subject Code" });
    let subName = result[0].subName as string;
    let query: string;
    if (tableName === "studentInfo") {
      const grade: string = req.body.grade;
      const exYear: string = req.body.exYear;
      const exMonth: string = req.body.exMonth;
      if (isAnyUndefined(grade, exYear, exMonth)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', grade = '${grade}', acYear = ${acYear}, sem = ${sem}, exYear = ${exYear}, exMonth = ${exMonth} WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;
    } else if (tableName === "paidCBT") {
      let branch: string = req.body.branch;
      if (isAnyUndefined(username, branch)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}', branch = '${branch}' WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;
    } else if (tableName == "paidReEvaluation") {
      let stat: string = req.body.stat;
      if (isAnyUndefined(username, stat)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}', stat = '${stat}' WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;
    } else {
      if (isAnyUndefined(username)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      query = `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem}, user = '${username}' WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;
    }

    await dbQuery(query);
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
  return res.json({ updated: true });
}

// Adding Student Details

export async function addStdDetails(req: Request, res: Response) {
  const rollNo: string = req.params.rollNo;
  const { details, tableName } = req.body;

  if (
    isAnyUndefined(
      rollNo,
      details,
      details.acYear,
      details.sem,
      tableName,
      details.subCode,
      details.acYear
    )
  ) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }

  const acYear: number = parseInt(details.acYear) as Acyear;
  const sem: number = parseInt(details.sem) as Sem;
  const subCode: string = details.subCode;

  const date = dayjs().format("DD-MMM-YY");
  try {
    let subName: any = await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${subCode}'`
    );
    if (subName.length === 0)
      return res.json({ error: { message: "Invalid Subject Code" } });
    subName = subName[0].subName as string;

    const query: string =
      tableName === "studentinfo"
        ? `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNo}", "${subCode}", "${subName}", "${details.grade}", ${acYear}, ${sem}, "${details.exYear}", "${details.exMonth}")`
        : `INSERT IGNORE INTO ${tableName} (rollNo, subCode, subName, acYear, sem, regDate) VALUES ('${rollNo}', '${subCode}', '${subName}', ${acYear}, ${sem}, '${date}')`;
    await dbQuery(query);
    return res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

// Deleting Student Details

export async function deleteStdDetails(req: Request, res: Response) {
  let rollNo: string = req.params.rollNo;
  let subCodes: string[] = req.body.subCodes as string[];
  let tableName: string = req.body.tableName;
  if (isAnyUndefined(rollNo, tableName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `DELETE FROM ${tableName} WHERE rollNo = '${rollNo}' ${
        subCodes === undefined
          ? ""
          : `AND subCode IN ('${subCodes.join("','")}')`
      }`
    );
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//adding a new user
export async function addUser(req: Request, res: Response) {
  const username: string = req.body.username;
  const password: string = md5(req.body.password);
  const displayName: string = req.body.displayName;
  if (isAnyUndefined(username, password, displayName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `INSERT INTO users VALUES ('${username}','${password}','${displayName}')`
    );
    res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

//deleting a user
export async function deleteUser(req: Request, res: Response) {
  const username = req.body.username;
  if (isAnyUndefined(username)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(`DELETE FROM users WHERE userName='${username}'`);
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function updateUser(req: Request, res: Response) {
  const context = req.query.context;
  const username: string = req.body.username;
  if (isAnyUndefined(context, username)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    if (context == "password") {
      const newPassword = md5(req.body.newPassword);
      if (isAnyUndefined(newPassword)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      await dbQuery(
        `UPDATE users SET password='${newPassword}' WHERE userName='${username}'`
      );
      res.json({ updated: true });
    } else if (context == "displayName") {
      const displayName: string = req.body.displayName;
      if (isAnyUndefined(displayName)) {
        return res.status(400).json(responses.NotAllParamsGiven);
      }
      await dbQuery(
        `UPDATE users SET displayName='${displayName}' WHERE userName='${username}'`
      );
      res.json({ updated: true });
    } else {
      res.send("give appropriate parameter value");
    }
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}

export async function getSubName(
  { body: { subCode } }: Request,
  res: Response
) {
  if (isAnyUndefined(subCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    const result = (await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = ? `,
      [subCode]
    )) as { subName: string }[];
    if (result.length == 0)
      return res.status(400).json(responses.InvalidParameterValue);

    res.json({ subName: result[0].subName });
  } catch (err) {
    logger.log("error", err);
    return res.json(responses.ErrorWhileDBRequest);
  }
}
