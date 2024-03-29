import { Response, Request, NextFunction } from "express";
import md5 from "md5";

import dbQuery from "../services/db";
import * as logger from "../services/logger";
import { secret } from "../../config-local";

function generateToken(username: string) {
  return username + "@" + md5(username + secret);
}

export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cookies = req.cookies;
  if (cookies) {
    const cookieValue = cookies.Token as string;
    if (cookieValue) {
      const [username, _Token] = cookieValue.split("@");
      if (generateToken(username) === cookieValue) {
        req.body.usernameInToken = username;
        next();
        return;
      }
    }
  }
  res.status(401).send("Unauthorized"); // Respond with Unauthorized status
}
export function isUserValid(req: Request, res: Response) {
  const username = req.body.username as string;
  const password = req.body.password as string;
  const ip = req.ip as string;

  dbQuery(
    `select userName, password, displayName from users where binary userName="${username}"`
  )
    .then(function (result: any) {
      if (result.length !== 1) {
        res.json({
          goahead: false,
          error: `Username ${username} does not exist`,
        });
        return;
      }

      const passwordHash = md5(password);

      if (passwordHash !== result[0]["password"]) {
        res.json({ goahead: false, error: `Incorrect password` });
        return;
      }

      logger.log("info", `${username} has logged in from ${ip.slice(7)}`);
      res.cookie("Token", generateToken(username), { httpOnly: true });
      res.json({
        goahead: true,
        username: username,
        displayName: result[0]["displayName"],
      });
    })
    .catch(function (err) {
      logger.log("error", err);
      res.status(500).json({
        goahead: false,
        error: "An unexpected error occurred while accessing the database.",
      });
    });
}
