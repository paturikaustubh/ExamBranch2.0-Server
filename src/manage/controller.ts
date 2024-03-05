import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import dayjs from "dayjs";
import { isAnyUndefined, responses } from "../services/common";
import md5 from "md5";

type Acyear = 0 | 1 | 2 | 3 | 4;
type Sem = 0 | 1 | 2;

// Below are the common functionalites for studentInfo, Print and Paid entries

// Getting Student Details

export async function getStdDetails(req: Request, res: Response) {
  const rollNo: string = req.query.rollNo as string;
  const tableName: string = req.query.tableName as string;
  if (isAnyUndefined(rollNo, tableName)) {
    res.status(400).json({ error: responses.NotAllParamsGiven });
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
    return res.json({ error: responses.ErrorWhileDBRequestWithUpdated });
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
  if (isAnyUndefined(rollNo, acYear, sem, tableName, subCode, newSubCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    let subName: any = await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${newSubCode}'`
    );
    if (subName.length === 0)
      return res.json({ error: "Invalid subCode given" });
    subName = subName[0].subName as string;
    const query: string =
      tableName === "studentInfo"
        ? `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', grade = '${req.body.grade}', acYear = ${acYear}, sem = ${sem}, exYear = ${req.body.exYear}, exMonth = ${req.body.exMonth} WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`
        : `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem} WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;

    await dbQuery(query);
    return res.json({ updated: true });
  } catch (err) {
    logger.log("error", err);
    return res.json({ error: responses.ErrorWhileDBRequestWithUpdated });
  }
}

// Adding Student Details

export async function addStdDetails(req: Request, res: Response) {
  const rollNo: string = req.params.rollNo;
  const acYear: number = parseInt(req.body.acYear) as Acyear;
  const sem: number = parseInt(req.body.sem) as Sem;
  const tableName: string = req.body.tableName;
  const subCode: string = req.body.subCode;
  if (isAnyUndefined(rollNo, acYear, sem, tableName, subCode)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  const date = dayjs().format("DD-MMM-YY");
  try {
    let subName: any = await dbQuery(
      `SELECT subName FROM codeNames WHERE subCode = '${subCode}'`
    );
    if (subName.length === 0)
      return res.json({ error: "Invalid subCode given" });
    subName = subName[0].subName as string;

    const query: string =
      tableName === "studentInfo"
        ? `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNo}", "${subCode}", "${subName}", "${req.body.grade}", ${acYear}, ${sem}, "${req.body.exYear}", "${req.body.exMonth}")`
        : `INSERT IGNORE INTO ${tableName} (rollNo, subCode, subName, acYear, sem, regDate) VALUES ('${rollNo}', '${subCode}', '${subName}', ${acYear}, ${sem}, '${date}')`;
    await dbQuery(query);
    return res.json({ done: true });
  } catch (err) {
    logger.log("error", err);
    return res.json({ done: responses.ErrorWhileDBRequestWithDone });
  }
}

// Deleting Student Details

export async function deleteStdDetails(req: Request, res: Response) {
  let rollNo: string = req.params.rollNo;
  let subCode: string = req.body.subCode;
  let tableName: string = req.body.tableName;
  if (isAnyUndefined(rollNo, tableName)) {
    return res.status(400).json(responses.NotAllParamsGiven);
  }
  try {
    await dbQuery(
      `DELETE FROM ${tableName} WHERE rollNo = '${rollNo}' ${
        subCode === undefined ? "" : `AND subCode = '${subCode}'`
      }`
    );
    res.json({ deleted: true });
  } catch (err) {
    logger.log("error", err);
    return res.json({ error: responses.ErrorWhileDBRequestWithDeleted });
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
    return res.json({ error: responses.ErrorWhileDBRequestWithDone });
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
    return res.json({ error: responses.ErrorWhileDBRequestWithDeleted });
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
    return res.json({ error: responses.ErrorWhileDBRequestWithUpdated });
  }
}
