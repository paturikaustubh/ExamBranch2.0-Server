import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import dayjs from "dayjs";

type Acyear = 0 | 1 | 2 | 3 | 4;
type Sem = 0 | 1 | 2;

// Below are the common functionalites for studentInfo, Print and Paid entries

// Getting Student Details

export async function getStdDetails(req: Request, res: Response) {
    const rollNum: string = req.params.rollNum;
    const year = parseInt(req.query.year as string) as Acyear;
    const sem = parseInt(req.query.sem as string) as Sem;
    const tableName: string = req.query.tableName as string;
    let query: string;

    if (year === 0 && sem === 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNum}' ORDER BY acYear ASC, sem ASC, subCode ASC`;
        
    else if (year !== 0 && sem === 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNum}' AND acYear = ${year} ORDER BY sem ASC, subCode ASC`;
    
    else if (year !== 0 && sem !== 0)
        query = `SELECT * FROM ${tableName} WHERE rollNo = '${rollNum}' AND acYear = ${year} and sem = ${sem} ORDER BY subCode ASC`;

    else {
        res.json({ error: "Invalid Year Sem given" });
        return;
    }
    try {
        let stdData: any = await dbQuery(query);
        stdData = JSON.parse(JSON.stringify(stdData));
        res.json({ stdData });
    } catch (err) {
        logger.log("error", err);
        res.json({ error: err });
    }
}

// Editing Student Details

export async function editStdDetails(req: Request, res: Response) {
    const rollNum: string = req.params.rollNum;
    const year: number = parseInt(req.body.year) as Acyear;
    const sem: number = parseInt(req.body.sem) as Sem;
    const tableName: string = req.body.tableName;
    const subjCode: string = req.body.subjCode;
    const newSubjCode: string = req.body.newSubjCode;
    try {
        let subjName: any = await dbQuery(`SELECT subName FROM codeNames WHERE subCode = '${newSubjCode}'`);
        if (subjName.length === 0)
            return res.json({ error: "Invalid subjCode given" });
        subjName = subjName[0].subName as string;
        const query: string = (tableName === "studentInfo") ? `UPDATE ${tableName} SET subCode = '${newSubjCode}', subName = '${subjName}', grade = '${req.body.grade}', acYear = ${year}, sem = ${sem}, exYear = ${req.body.examYear}, exMonth = ${req.body.examMonth} WHERE rollNo = '${rollNum}' AND subCode = '${subjCode}'` :
            `UPDATE ${tableName} SET subCode = '${newSubjCode}', subName = '${subjName}', acYear= ${year}, sem = ${sem} WHERE rollNo = '${rollNum}' AND subCode = '${subjCode}'`;
    
        await dbQuery(query);
        return res.json({ updated: true });
    } catch(err) {
        logger.log("error", err);
        return res.json({ error: err });
    }
}

// Adding Student Details

export async function addStdDetails(req: Request, res: Response) {
    const rollNum: string = req.params.rollNum;
    const year: number = parseInt(req.body.year) as Acyear;
    const sem: number = parseInt(req.body.sem) as Sem;
    const tableName: string = req.body.tableName;
    const subjCode: string = req.body.subjCode;
    const date = dayjs().format("DD-MMM-YY"); 
    try {
        let subjName: any = await dbQuery(`SELECT subName FROM codeNames WHERE subCode = '${subjCode}'`);
        if (subjName.length === 0)
            return res.json({ error: "Invalid subjCode given" });
        subjName = subjName[0].subName as string;

        const query: string = (tableName === "studentInfo") ? `INSERT IGNORE INTO studentInfo (rollNo, subCode, subName, grade, acYear, sem, exYear, exMonth) VALUES ("${rollNum}", "${subjCode}", "${subjName}", "${req.body.grade}", ${year}, ${sem}, "${req.body.examYear}", "${req.body.examMonth}")` :
            `INSERT IGNORE INTO ${tableName} (rollNo, subCode, subName, acYear, sem, regDate) VALUES ('${rollNum}', '${subjCode}', '${subjName}', ${year}, ${sem}, '${date}')`;
        
        await dbQuery(query);
        return res.json({ done: true });
    } catch (err) {
        logger.log("error", err);
        return res.json({ done: false });
        
    }
}

// Deleting Student Details

export async function deleteStdDetails(req: Request, res: Response) {
    let rollNum: string = req.params.rollNum;
    let subjCode: string = req.body.subjCode;
    let tableName: string = req.body.tableName;
    try {
        await dbQuery(`DELETE FROM ${tableName} WHERE rollNo = '${rollNum}' ${(subjCode === undefined)? '': `AND subCode = '${subjCode}'`}`);
        res.json({ deleted: true });
    } catch (err) {
        logger.log("error", err);
        return res.json({ error: err });
    }
}


