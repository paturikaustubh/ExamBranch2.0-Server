import { Request, Response } from "express";

import dbQuery from "../services/db";
import * as logger from "../services/logger";
import { CBTSubjectsRow, PrintCBTRow } from "../interfaces/cbt"

function isAnyUndefined(...variables: any[]): boolean {
    return variables.some(variable => variable === undefined);
}

export async function searchCBT(req: Request, res: Response) {
    
    const acYear = req.query.acYear;
    const sem = req.query.sem;
    const reg = req.query.reg;
    const branch = req.query.branch;
    const rollNo = req.params.rollNo;

    if(isAnyUndefined(acYear, sem, reg, branch, rollNo)) {
        res.status(400).json({
            //TODO: better error msg
            error: "Not all parms given"
        })
        return;
    }
    const subCodes: string[] = [];
    const subNames: string[] = [];
    const mapper: { [key: string]: string } = {};
    try {
        let rowsInPrintTable = await dbQuery(`select * from printcbt where rollNo='${rollNo}' and acYear= ${acYear} and sem = ${sem}`) as PrintCBTRow[];
        let printTableExist: boolean = (rowsInPrintTable.length > 0);

        let query = printTableExist ? `select subCode, subName from printcbt where rollNo="${rollNo}"`
            : `select t.subCode,t.subName from cbtsubjects t Left join paidcbt p on t.subCode=p.subCode and p.rollNo="${rollNo}" where t.acYear=${acYear} and t.sem=${sem} and p.subCode is null and t.regYear=${reg} and t.branch="${branch}"`
        
        let cbtSubjectsTable = await dbQuery(query) as CBTSubjectsRow[];

        cbtSubjectsTable.forEach((e) => {
            subCodes.push(e.subCode);
            subNames.push(e.subName);
            mapper[e.subCode] = e.subName;
        });
        res.send({ subCodes, subNames, mapper, printTableExist });
    } catch (err) {
        logger.log('error', err);
        res.status(500).json({ error: "Error occured while db request check Server log for more info" });
    }
}

async function processCBT(req: Request, res: Response, tableName: string) {
    const acYear:number = req.body.acYear;
    const sem:number = req.body.sem;
    const subCodes: string[] = req.body.subCodes;
    const rollNo:string = req.params.rollNo;
    const subNames: string[] = req.body.subNames;
    const branch: string = req.body.branch;
    const userName:string = req.body.userName;
    
    if(isAnyUndefined(acYear, sem, subCodes, subNames, branch, rollNo, userName)) {
        res.status(400).json({
            error: "Not all parameters given"
        });
        return;
    }

    try {
        await Promise.all(
            subCodes.map(
                async (subCode, index) => {
                    await dbQuery(`insert ignore into ${tableName}(rollNo, subCode, acYear, sem, subName, regDate, branch, user)values("${rollNo}","${subCode}","${acYear}","${sem}","${subNames[index]}", curdate(),"${branch}", "${userName}")`);
                    if (tableName === 'paidcbt') {
                        await dbQuery(`delete from printcbt where rollNo = "${rollNo}" and subCode="${subCode}"`);
                    }
                }
            )
        )
        logger.log('info', `${userName} add rollNo: ${rollNo} to ${tableName} `);
        res.json({ done: true })
    } catch (err) {
        logger.log('error', err);
        res.status(500).json({ error: "Error occurred while processing the request. Check server logs for more information." });
    }
}

export async function printCBT(req: Request, res: Response) {
    await processCBT(req, res, 'printcbt');
}

export async function paidCBT(req: Request, res: Response) {
    await processCBT(req, res, 'paidcbt');
}

export async function deleteFromCBT(req: Request, res: Response) {
    const year = parseInt(req.body.year || 0);
    const sem = parseInt(req.body.sem || 0);
    try {
        if(year === 0 && sem === 0) {
            await dbQuery("truncate paidcbt");
            // await dbQuery("truncate cbtsubjects");
            res.send({ deleted: true });
            return;
        } 
        let query = "delete from paidcbt where ";
        if (year !== 0) {
            query += `acYear = ${year}`;
        }
        if (sem !== 0) {
            if(year !== 0) query += " and ";
            query += `sem = ${sem}`;
        }
        await dbQuery( query );
    } catch (err) {
        logger.log('error', err);
        res.status(500).json({ error: "Error occurred while processing the request. Check server logs for more information." });
    }
}

