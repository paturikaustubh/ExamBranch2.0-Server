import { Request, Response } from "express";
import path from "path";
import * as fs from "fs";

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

export function uploadStudentInfo(req: Request, res: Response) {
    const loc = path.join(req.body.loc.trim(), "backup.csv")
    const tableColumns: { [key: string]: boolean } = { 'rollNo': false, 'subCode': false, 'subName': false, 'grade': false, 'acYear': false, 'sem': false, 'exYear': false, 'exMonth': false }

    fs.readFile(loc, 'utf8', (err, data) => {
        // Return if file not exist (or can't read)
        if (err) {
            logger.log('error', 'Error reading CSV file:', err);
            res.json({ done: false, error: "Error reading CSV file can't read file"+loc })
            return;
        }

        // Split the CSV data into rows
        const rows = data.trim().split('\n').map(row => row.split(','));

        // Seperate headers and values
        let [header, ...values] = rows;
        let tmpColumns: string[] = [], colIndexs: number[] = []
        for (let i = 0; i < header.length; i++) {
            if (header[i] in tableColumns) {
                if (tableColumns[header[i]]) {
                    logger.log('error', `Restoring studentinfo failed with error csv file contains dublicate columns ${header[i]}`)
                    res.json({done:false, error:"csv file contains dublicate columns"})
                    return;
                }
                tmpColumns.push(header[i]);
                colIndexs.push(i);
                tableColumns[header[i]] = true;
            }
        }

        // return if required columns not present
        if (tmpColumns.length !== Object.keys(tableColumns).length) {
            logger.log('error', `Restoring studentinfo failed with error csv file dose not have required values '${Object.keys(tableColumns)}' but got '${tmpColumns}'`);
            res.json({done:false, error:"csv file dose not have required values"});
            return;
        }

        // Gather required columns
        values = values.map((row) => getElementsFromIndexs(row, colIndexs));

        // Insert into database
        dbQuery(`insert ignore into studentinfo (${tmpColumns.join(', ')}) values ?`, [values])
            .then(function(value) {
                logger.log('info', `Restoring studentinfo done! \nWith result:`, value);
                res.json({ done: true });
            })
            .catch(
                function (err) {
                    logger.log('error', `Restoring studentinfo falied error inserting data into MySQL:`, err);
                    res.json({ done: false, error: "Error inserting data into MySQL check Server log for more info" });
                    return;
                }
            )
    })
}