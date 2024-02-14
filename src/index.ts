import express, { Express, Request, Response } from "express";
import cors from "cors"

import * as config from "../config-local";
import * as logger  from "./services/logger";
import coreRouter from "./coreRouter";;

const app: Express = express();

app.use(express.json());
app.use(cors());


app.use("/api", coreRouter);

// Starting the server
const server = app.listen(config.port, () => {
  logger.log('info', 'Server started!');
});


function gracefulClose(signal: string) {
  logger.log('info', `Received ${signal} initiating server close`);
  server.close( () => logger.log('info','Server closed'));
  process.exit();
}

process.on('SIGINT', gracefulClose);
process.on('SIGTERM', gracefulClose);