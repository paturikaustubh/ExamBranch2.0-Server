import { Response, Request } from "express";
import connection from "../services/db";
import * as logger from "../services/logger";
import md5 from "md5";

export function isUserValid(req: Request, res: Response) {
  const userName = req.body.userName;
  const password = req.body.password;

  connection.query(
    `select userName, password from users where binary userName="${userName}"`,
    (err, result) => {
      if (err) {
        logger.log("error", err);
        res
          .status(500)
          .json({
            goahead: false,
            error: "An unexpected error occurred while accessing the database.",
          });
        return;
      }

      if (result.length !== 1) {
        res.json({
          goahead: false,
          error: `No user with username ${userName} exist`,
        });
        return;
      }

      const hash = md5(password);

      if (hash !== result[0]["password"]) {
        res.json({ goahead: false, error: `Incorrect password` });
      }

      logger.log("info", `${userName} has logged in`);
      res.json({ goahead: true, userName: userName });
      
    }
  );
}
