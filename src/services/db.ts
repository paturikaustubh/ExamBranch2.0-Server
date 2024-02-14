import mysql from "mysql";

import { dbConfig } from "../../config-local";
import * as logger from "./logger";

const connection = mysql.createConnection(dbConfig);

connection.connect((err, result) => {
  err ? 
    logger.log("fatal", err) :
    logger.log("info", "Connected to database");
});

export default connection;
