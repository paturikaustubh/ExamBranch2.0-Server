import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import { Details } from "../interfaces/reval";
import dayjs from "dayjs";
import { isAnyUndefined, responses } from "../services/common";


// Revaluation Search

export async function revalSearch(req: Request, res: Response) {
    const rollNum: string = req.params.rollNum;
    const examMonth = req.query.examMonth;
    const examYear = req.query.examYear;
    let details: Details = {};
    if (isAnyUndefined(rollNum, examMonth, examYear)) {
        res.status(400).json({ error: responses.NotAllParamsGiven });
        return;
    }
    let subjDetails: { subjCodes: string[]; subjNames: string[] }[] = [];
    try {
        const result: any = await dbQuery(`SELECT subName FROM printReval WHERE rollNo = '${rollNum}';`);
        // Checking whether the std is already in the print table for registration otherwise fetching std details from the studentInfo table which are not paid
        const query: string = (result.length > 0) ? `SELECT subCode, subName FROM printReval WHERE rollNo = ? AND acYear = ? AND sem = ?` :
            `SELECT std.subCode, std.subName FROM studentInfo std LEFT JOIN paidReEvaluation paidStd ON std.subCode = paidStd.subCode AND std.rollNo = paidStd.rollNo WHERE std.rollNo = ? AND std.exMonth = ${examMonth} AND std.exYear = ${examYear} AND std.acYear = ? AND std.sem = ? AND paidStd.subCode IS NULL AND paidStd.rollNo IS NULL`;
        
        let year: number = 1, sem: number = 1;
        for (let i = 0; i < 8; i++) {
            const result: any = await dbQuery(query, [rollNum, year, sem]);
            let subjCodes: string[] = [];
            let subjNames: string[] = [];
            result.forEach((val: { subCode: string; subName: string; }) => {
                subjCodes.push(val.subCode);
                subjNames.push(val.subName);
            });
            year = (i & 1) ? ++year : year;
            sem = (sem == 1) ? 2 : 1;
            subjDetails.push({ subjCodes: subjCodes, subjNames: subjNames });
        }
        subjDetails.forEach((subjDetails, index) => {
            const semCode = String.fromCharCode("A".charCodeAt(0) + index);
            details[semCode] = subjDetails;
        });
        JSON.stringify(details);
        res.json(details);
    } catch (err) {
        logger.log("error", err);
        res.json({ error: responses.ErrorWhileDBRequest });
    }
}


// Common function for Paid and Register 

async function revalProcess(req: Request, reg?: string) {
    const rollNum: string = req.params.rollNum;
    const userName: string = req.body.userName;
    const details = [req.body.A, req.body.B, req.body.C, req.body.D, req.body.E, req.body.F, req.body.G, req.body.H];
    let year: number = 1, sem: number = 1, semCode: string = "A";
    if (isAnyUndefined(rollNum, userName, ...details)) {
        throw responses.NotAllParamsGiven;
    }
    const date = dayjs().format("DD-MMM-YY");
    for (const subjects of details) {
        for (let i = 0; i < subjects.subjCodes.length; i++) {
            try {
                const [subjCode, subjName] = [subjects.subjCodes[i], subjects.subjNames[i]];
                (reg === undefined) ? await dbQuery(`INSERT IGNORE INTO printReval (rollNo, subCode, subName, acYear, sem, user, regDate) VALUES ('${rollNum}', '${subjCode}', '${subjName}', ${year}, ${sem}, '${userName}', '${date}')`) :
                    await dbQuery(`INSERT IGNORE INTO paidReEvaluation (rollNo, subCode, subName, acYear, sem, user, stat, regDate) VALUES ('${rollNum}', '${subjCode}', '${subjName}', '${year}', '${sem}', '${userName}', '${(reg === semCode) ? 'R' : ''}', '${date}')`); 
            } catch (err) {
                logger.log("error", err);
                throw responses.ErrorWhileDBRequestWithDone;
            }
        }
        sem = (sem === 1) ? 2 : 1;
        year = (sem === 1) ? ++year : year;
        semCode = String.fromCharCode(semCode.charCodeAt(0) + 1);
    }
}


// Inserting std into printReval Table

export async function printReval(req: Request, res: Response) {
    try {
        await revalProcess(req);
    } catch(err) {
        logger.log("error", err);
        return res.json({ error: err });
    }
    return res.json({ done: true });
}

// Inserting std into paidReEvaluation table and Deleting std from the printReval table

export async function registerReval(req: Request, res: Response) {
    const rollNum = req.params.rollNum;
    const regular = req.body.regular;
    if (isAnyUndefined(rollNum, regular)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    try {
        await revalProcess(req, regular);
        await dbQuery(`DELETE FROM printReval WHERE rollNo = '${rollNum}'`);
    } catch (err) {
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithDone });
    }
    return res.json({ done: true });
}






