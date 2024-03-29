import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import dayjs from "dayjs";
import { Fines } from "../interfaces/cost";
import { responses } from "../services/common";

//To get costs for required case like  supple only
export async function getCost(req: Request, res: Response) {
  const { module } = req.query;
  try {
    //if it is for revaluation purpose
    if (module == "reval") {
      let result: any = await dbQuery(`select rev from costs`);
      const json = JSON.stringify(result[0]);
      res.send(json);
    } else if (module == "cbt") {
      //if it is for CBT purpose
      let result: any = await dbQuery(`select cbc,cac,cfc from costs where 1`);
      const json = JSON.stringify(result[0]);
      res.send(json);
    } else if (module == "supple") {
      //if it is for supple purpose
      const currentDate: dayjs.Dayjs = dayjs();
      let costs: any = await dbQuery(`select sbc,sac,sfc from costs`);
      let fines: Fines = {};
      let semChar = "A";
      for (let i = 0; i < 8; i++) {
        let dates: any = await dbQuery(
          `SELECT no_fine,fine_1Dt,fine_2Dt,fine_3Dt FROM fines WHERE semChar='${semChar}'`
        );
        let noFine = dayjs(dates[0]["no_fine"], "DD-MMM-YY");
        let fine1Date = dayjs(dates[0]["fine_1Dt"], "DD-MMM-YY");
        let fine2Date = dayjs(dates[0]["fine_2Dt"], "DD-MMM-YY");
        if (currentDate <= noFine) {
          fines[semChar] = 0;
        } else if (currentDate <= fine1Date) {
          let result: any = await dbQuery(
            `SELECT fine_1 FROM fines WHERE semChar='${semChar}'`
          );
          fines[semChar] = result[0]["fine_1"];
        } else if (currentDate <= fine2Date) {
          let result: any = await dbQuery(
            `SELECT fine_2 FROM fines WHERE semChar='${semChar}'`
          );
          fines[semChar] = result[0]["fine_2"];
        } else {
          let result: any = await dbQuery(
            `SELECT fine_3 FROM fines WHERE semChar='${semChar}'`
          );
          fines[semChar] = result[0]["fine_3"];
        }
        semChar = String.fromCharCode(semChar.charCodeAt(0) + 1);
      }
      res.json({ costs: costs[0], fines: fines });
    } else {
      res.send("incorrect parameter");
    }
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileReadingOrProcessing);
  }
}
//to update cost for supple,revaluation and CBT
export async function updateCost(req: Request, res: Response) {
  try {
    await dbQuery(`UPDATE costs set sbc=${req.body.sbc} ,sac=${req.body.sac},sfc=${req.body.sfc}
        ,rev=${req.body.rev},cbc=${req.body.cbc} ,cac=${req.body.cac},cfc=${req.body.cfc} where 1`);
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
    return;
  }
  res.send({ done: true });
}
//To update fines for supple
export async function updateFine(req: Request, res: Response) {
    try{
        await dbQuery(`REPLACE INTO fines VALUES ('${req.body.semChar}',${req.body.fine1},${req.body.fine2},${req.body.fine3}
        ,'${req.body.fine1date}','${req.body.fine2date}' ,'${req.body.fine3date}','${req.body.nofinedate}')`)
    }
    catch(err){
        logger.log("error",err)
        res.status(500).json({ error: responses.ErrorWhileDBRequest });
        return
    }
    res.send({ done: true });
}
//to get fine details
export async function getFines(req: Request, res: Response) {
    try{
        let result:any = await dbQuery(`select * from fines`) 
        const json = JSON.stringify(result);
        res.send(json)
    }
    catch(err){
        logger.log("error",err)
        res.status(500).json({ error: responses.ErrorWhileReadingOrProcessing });
        return
    }
}
