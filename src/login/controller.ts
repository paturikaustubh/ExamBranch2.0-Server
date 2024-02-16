import { Response, Request } from "express";
import dbQuery from "../services/db";
import * as logger from "../services/logger";
import md5 from "md5";

export function isUserValid(req: Request, res: Response) {
  const userName = req.body.userName;
  const password = req.body.password;

  dbQuery(`select userName, password from users where binary userName="${userName}"`).then(
    
    function(result: any) {
      // let response: LoginResponse;
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
        return;
      }

      logger.log("info", `${userName} has logged in`);
      res.json({ goahead: true, userName: userName });
    })
    .catch(
    function(err) {
      logger.log("error", err);
      res
        .status(500)
        .json({
          goahead: false,
          error: "An unexpected error occurred while accessing the database.",
        });
    }
  )

}
