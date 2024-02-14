import { ConnectionConfig } from "mysql";
import 'dotenv/config';

export const port: number = 6969;

export const dbConfig: ConnectionConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
}