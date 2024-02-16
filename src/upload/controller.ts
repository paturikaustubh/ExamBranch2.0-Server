import { Request, Response } from "express";
import path from "path";
import { promises as fs } from 'fs';

import dbQuery from "../services/db";
import * as logger from "../services/logger";

function getElementsFromIndexs(array: string[], indexs: number[]) {
    const elements: string[] = [];
    for (const index of indexs) {
        if (index >= 0 && index < array.length) {
            elements.push(array[index]);
        } else {
            // This should never run
            console.warn(`Index ${index} is out of range.`);
        }
    }
    return elements;
}

async function uploadFromCSV(location:string, tableColumns: {[key: string]: boolean }, tableName:string){
    let response:  { done: boolean, error?: string };
    try {
        const data = await fs.readFile(location, 'utf8');
        const rows = data.trim().split('\n').map(row => row.split(','));

        // Seperate headers and values
        let [header, ...values] = rows;
        let tmpColumns: string[] = [], colIndexs: number[] = []
        for (let i = 0; i < header.length; i++) {
            if (header[i] in tableColumns) {
                if (tableColumns[header[i]]) {
                    logger.log('error', `Restoring ${tableName} failed with error csv file contains dublicate columns ${header[i]}`)
                    return { done: false, error: "csv file contains dublicate columns" };
                }
                tmpColumns.push(header[i]);
                colIndexs.push(i);
                tableColumns[header[i]] = true;
            }
        }

        // return if required columns not present
        if (tmpColumns.length !== Object.keys(tableColumns).length) {
            logger.log('error', `Restoring ${tableName} failed with error csv file dose not have required values '${Object.keys(tableColumns)}' but got '${tmpColumns}'`);
            return { done: false, error: "csv file dose not have required values" };
        }

        // Gather required columns
        values = values.map((row) => getElementsFromIndexs(row, colIndexs));

        // Insert into database
        try {
            const value = await dbQuery(`insert ignore into ${tableName} (${tmpColumns.join(', ')}) values ?`, [values])
            logger.log('info', `Restoring ${tableName} done! \nWith result:`, value);
            response = { done: true };
        } catch (err) {
            logger.log('error', `Restoring ${tableName} falied error inserting data into MySQL:`, err);
            response = { done: false, error: "Error inserting data into MySQL check Server log for more info" };
        }

    } catch (err) {
        logger.log('error', 'Error reading CSV file:', err);
        response = { done: false, error: "Error reading CSV file can't read file" + location }
    }
    return response;
}

export async function uploadStudentInfo(req: Request, res: Response) {
    const loc = path.join(req.body.loc.trim(), "backup.csv")
    const tableColumns: { [key: string]: boolean } = { 'rollNo': false, 'subCode': false, 'subName': false, 'grade': false, 'acYear': false, 'sem': false, 'exYear': false, 'exMonth': false }

    res.json(await uploadFromCSV(loc, tableColumns, "studentinfo"))

}

export async function uploadCBTSubjects(req: Request, res: Response) {
    const loc = path.join(req.body.loc.trim(), "cbtSubjects.csv")
    const tableColumns: { [key: string]: boolean } = { 'subCode': false, 'subName': false, 'branch': false, 'acYear': false, 'sem': false, 'regYear': false }

    res.json(await uploadFromCSV(loc, tableColumns, "cbtsubjects"))

}