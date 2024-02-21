import { Request, Response } from "express";
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

type tableNames = 'paidsupply' | 'printsupply' | 'paidreval' | 'printreval' | 'paidcbt' | 'printcbt'

const tables:{[key in tableNames]:{query:string, ordering:string, fileName:string}} = {
    paidsupply: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" from paidsupply `,
        ordering:" order by rollNo, acYear, sem, subCode ",
        fileName: "Registred Supply"
    },
    printsupply: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM printsupply `,
        ordering:" order by rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred Supply"
    },
    paidreval: {
        query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM paidreval `,
        ordering: " ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Registred Reval"
    },
    printreval: {
        query: `SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", regDate AS "Registration Dt" FROM printreval `,
        ordering: " ORDER BY rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred Reval"
    },
    paidcbt: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM paidcbt `,
        ordering:" order by rollNo, acYear, sem, subCode ",
        fileName: "Registred CBT"
    },
    printcbt: {
        query:`SELECT rollNo AS "Ht Number", subCode AS "Code", subName AS "Subject", acYear AS "Year", sem AS "Semester", branch AS "Branch", regDate AS "Registration Dt", user AS Registrant FROM printcbt `,
        ordering:" ORDER by rollNo, acYear, sem, subCode ",
        fileName: "Un-Registred CBT"
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
    }else {
        console.log(tableName, Object.keys(tables))
        // TODO: better msg
        res.status(400).json(responses.BadRequest)
    }
}
