import mysql from "mysql";

import { dbConfig } from "../../config-local";
import * as logger from "./logger";

const connection = mysql.createConnection(dbConfig);

connection.connect((err, result) => {
  err ? 
    logger.log("fatal", err) :
    logger.log("info", "Connected to database");
});

function dbQuery(query: string, parms?:any[]) {
  return new Promise((resolve, reject) => {
    connection.query(query, parms, (err, result, fields) => {
      
      err ?
        reject(err) :
        resolve(result);
    });
  });
}

export function dbQueryWithFields(query: string, parms?:any[]) {
  return new Promise((resolve, reject) => {
    connection.query(query, parms, (err, result, fields) => {
      
      err ?
        reject(err) :
        resolve([result,fields]);
    });
  });
}

export default dbQuery;
