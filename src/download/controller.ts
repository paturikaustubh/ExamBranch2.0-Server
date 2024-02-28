import { Request, Response, query } from "express";
import path from "path";
import dbQuery, { dbQueryWithFields } from "../services/db";
import * as logger from "../services/logger";
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { isAnyUndefined, responses } from "../services/common";
import { FieldInfo } from "mysql";
import dayjs from "dayjs";

export function convertToXLSX(result:any, fields: FieldInfo[], tableName:string):{path:string}|{ error:string} {
    try {
        const data: any[][] = [];

        data.push(fields.map(field => field.name)); // Add column headers
        result.forEach((row:any) => {
            data.push(Object.values(row));
        });

        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.aoa_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        
        const timestamp = Date.now();
        const excelFilePath = path.join("tmp", `${tableName}_${timestamp}.xlsx`);

        // Write the workbook to a file
        xlsx.writeFile(workbook, excelFilePath);
        return {path:excelFilePath}
    } catch (err){
        logger.log('error', "Error while creating xlsx file for table " + tableName, err)
        return {error:"Error while creating xlsx file"}
    }
}

async function downloadTable(tableName: string, res: Response, fileNamePrefix: string, query:string) {
    let result, fields: FieldInfo[];

    try {
        [result, fields] = await dbQueryWithFields(query) as [any, FieldInfo[]];
        console.log(fields);
    } catch (err) {
        return res.status(500).json(responses.ErrorWhileDBRequestWithDone);
    }

    let out = convertToXLSX(result, fields, tableName);

    if ('error' in out) {
        return res.status(500).json(out);
    }

    const fileName = out.path;
    const downloadFileName = `${fileNamePrefix}.xlsx`;

    res.download(fileName, downloadFileName, (err) => {
        if (err) {
            logger.log('error', 'Error downloading file:', err);
            return;
        }

        fs.unlink(fileName, (err) => {
            if (err) {
                logger.log('error', 'Error deleting file:', err);
            }
        });
    });
}

type tableNames = 'paidSupply' | 'printSupply' | 'paidReEvaluation' | 'printReval' | 'paidCBT' | 'printCBT' | 'studentInfo'

const tables:{[key in tableNames]:{query:string, ordering:string, fileName:string}} = {
    paidSupply: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" from paidSupply `,
        ordering:" ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Registred Supply"
    },
    printSupply: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM printSupply `,
        ordering:" ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred Supply"
    },
    paidReEvaluation: {
        query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM paidReEvaluation `,
        ordering: " ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Registred Reval"
    },
    printReval: {
        query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM printReval `,
        ordering: " ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred Reval"
    },
    paidCBT: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM paidCBT `,
        ordering:" ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Registred CBT"
    },
    printCBT: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM printCBT `,
        ordering:" ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred CBT"
    },
    studentInfo: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", grade AS "Grade", acYear AS "Year", sem AS "Semester", exYear AS "Exam Year", exMonth AS "Exam Month" FROM studentInfo `,
        ordering:" ORDER BY acYear, sem, subCode ",
        fileName: "Student Info"
    }

}
export async function downloadHandler({params,query:{sem, acYear}}:Request, res:Response) {
    const tableName = params.tableName as tableNames;
    if (isAnyUndefined(tableName, sem, acYear)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }

    let condition = (parseInt(acYear as string) !== 0 && parseInt(sem as string) !== 0)?` WHERE acYear=${acYear} AND sem=${sem} `:"";
    if( tableName in tables) {
        const {query, ordering, fileName} = tables[tableName];
        await downloadTable(tableName, res, `${fileName}_${dayjs().format('DD-MMM-YY_hh-mm_A')}`, query + condition + ordering);
    } else {
        // TODO: better msg
        res.status(400).json(responses.BadRequest)
    }
}

export async function manageDBdownloadHandler({ params, query }: Request, res: Response) {
    const rollNo = params.rollNo as string;
    const tableName = query.tableName as tableNames;
    const acYear: number = parseInt(query.acYear as string);
    const sem: number = parseInt(query.sem as string);
    if (isAnyUndefined(rollNo, tableName, sem, acYear)) {
        return res.status(400).json(responses.NotAllParamsGiven);
    }
    let condition: string;
    if (acYear === 0 && sem === 0)
        condition = `WHERE rollNo = '${rollNo}' `;
        
    else if (acYear !== 0 && sem === 0)
        condition = `WHERE rollNo = '${rollNo}' AND acYear = ${acYear} `;
    
    else if (acYear !== 0 && sem !== 0)
        condition = `WHERE rollNo = '${rollNo}' AND acYear = ${acYear} and sem = ${sem} `;

    else {
        res.json({ error: responses.BadRequest });
        return;
    }
    if( tableName in tables) {
        const {query, ordering, fileName} = tables[tableName];
        await downloadTable(tableName, res, `${rollNo}_${fileName}_${dayjs().format('DD-MMM-YY_hh-mm_A')}`, query + condition + ordering);
    }else {
        res.status(400).json(responses.BadRequest)
    }
}
