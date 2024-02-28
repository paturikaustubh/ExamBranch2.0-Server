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
    const rollNo: string = req.params.rollNo;
    const acYear = parseInt(req.query.acYear as string) as Acyear;
    const sem = parseInt(req.query.sem as string) as Sem;
    const tableName: string = req.query.tableName as string;
    if (isAnyUndefined(rollNo, acYear, sem, tableName)) {
        res.status(400).json({ error: responses.NotAllParamsGiven });
        return;
    }
    let query: string;

    if (acYear === 0 && sem === 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNo}' ORDER BY acYear ASC, sem ASC, subCode ASC`;
        
    else if (acYear !== 0 && sem === 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNo}' AND acYear = ${acYear} ORDER BY sem ASC, subCode ASC`;
    
    else if (acYear !== 0 && sem !== 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNo}' AND acYear = ${acYear} and sem = ${sem} ORDER BY subCode ASC`;

    else {
        res.json({ error: responses.BadRequest });
        return;
    }
    try {
        let stdData: any = await dbQuery(query);
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
    if (isAnyUndefined(rollNo, acYear, sem, tableName, subCode, newSubCode)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    try {
        let subName: any = await dbQuery(`SELECT subName FROM codeNames WHERE subCode = '${newSubCode}'`);
        if (subName.length === 0)
            return res.json({ error: "Invalid subCode given" });
        subName = subName[0].subName as string;
        const query: string = (tableName === "studentInfo") ? `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', grade = '${req.body.grade}', acYear = ${acYear}, sem = ${sem}, exYear = ${req.body.examYear}, exMonth = ${req.body.examMonth} WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'` :
            `UPDATE ${tableName} SET subCode = '${newSubCode}', subName = '${subName}', acYear= ${acYear}, sem = ${sem} WHERE rollNo = '${rollNo}' AND subCode = '${subCode}'`;
    
        await dbQuery(query);
        return res.json({ updated: true });
    } catch(err) {
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
        let subName: any = await dbQuery(`SELECT subName FROM codeNames WHERE subCode = '${subCode}'`);
        if (subName.length === 0)
            return res.json({ error: "Invalid subCode given" });
        subName = subName[0].subName as string;

        const query: string = (tableName === "studentInfo") ? `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNo}", "${subCode}", "${subName}", "${req.body.grade}", ${acYear}, ${sem}, "${req.body.examYear}", "${req.body.examMonth}")` :
            `INSERT IGNORE INTO ${tableName} (rollNo, subCode, subName, acYear, sem, regDate) VALUES ('${rollNo}', '${subCode}', '${subName}', ${acYear}, ${sem}, '${date}')`;
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
        await dbQuery(`DELETE FROM ${tableName} WHERE rollNo = '${rollNo}' ${(subCode === undefined)? '': `AND subCode = '${subCode}'`}`);
        res.json({ deleted: true });
    } catch (err) {
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithDeleted });
    }
}

//adding a new user
export async function addUser(req: Request, res: Response) {
    const userName:string = req.body.userName;
    const password:string= md5(req.body.password);
    const displayName:string =req.body.displayName;
    if (isAnyUndefined(userName, password,displayName)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    try{
        await dbQuery(`INSERT INTO users VALUES ('${userName}','${password}','${displayName}')`)
        res.json({done : true })
    }catch(err){
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithDone });
    }
}

//deleting a user
export async function deleteUser(req: Request, res: Response) {
    const userName = req.body.userName;
    if (isAnyUndefined(userName)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    try{
        await dbQuery(`DELETE FROM users WHERE userName='${userName}'`)
        res.json({deleted : true })
    }catch(err){
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithDeleted });
    }
}

export async function updateUser(req: Request, res: Response) {
    const context= req.query.context;
    const userName :string= req.body.userName;
    if (isAnyUndefined(context,userName)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    try{
        if(context =="password"){
            const newPassword = md5(req.body.newPassword);
            if (isAnyUndefined(newPassword)) {
                return res.status(400).json(responses.NotAllParamsGiven);
            }
            await dbQuery(`UPDATE users SET password='${newPassword}' WHERE userName='${userName}'`)
            res.json({updated : true })
        }else if(context == "displayName"){
            const displayName:string =req.body.displayName;
            if (isAnyUndefined(displayName)) {
                return res.status(400).json(responses.NotAllParamsGiven);
            }
            await dbQuery(`UPDATE users SET displayName='${displayName}' WHERE userName='${userName}'`)
            res.json({updated : true })
        }else{
            res.send("give appropriate parameter value")
        }
       
    }catch(err){
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithUpdated });
    }
}


