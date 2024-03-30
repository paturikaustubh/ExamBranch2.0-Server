import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import dayjs from "dayjs";
import { Fines } from "../interfaces/cost";
import { isAnyUndefined, responses } from "../services/common";

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
    // const currentDate:dayjs.Dayjs
      let costs: any = await dbQuery(`select sbc,sac,sfc from costs`);
      let fines: Fines = {};
      let semChar = "A";
      // console.log(currentDate)
      for (let i = 0; i < 8; i++) {
        let dates: any = await dbQuery(
          `SELECT no_fine,fine_1Dt,fine_2Dt,fine_3Dt FROM fines WHERE semChar='${semChar}'`
        );
        let noFine = dayjs(dates[0]["no_fine"], "DD MMM, YY");
        let fine1Date = dayjs(dates[0]["fine_1Dt"], "DD MMM, YY");
        let fine2Date = dayjs(dates[0]["fine_2Dt"], "DD MMM, YY");
        noFine = noFine.add(1, 'day');
        fine1Date = fine1Date.add(1, 'day');
        fine2Date = fine2Date.add(1, 'day');
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
  const sbc:number=req.body.sbc;
  const sac:number=req.body.sac;
  const sfc:number=req.body.sfc;
  const rev:number=req.body.rev;
  const cbc:number=req.body.cbc;
  const cac:number=req.body.cac;
  const cfc:number=req.body.cfc;
  if (isAnyUndefined(sbc,sac,sfc,rev,cbc,cac,cfc)) {
    res.status(400).json(responses.NotAllParamsGiven);
    return;
  }
  try {
    await dbQuery(`UPDATE costs set sbc=${sbc} ,sac=${sac},sfc=${sfc}
        ,rev=${rev},cbc=${cbc} ,cac=${cac},cfc=${cfc} where 1`);
  } catch (err) {
    logger.log("error", err);
    res.status(500).json(responses.ErrorWhileDBRequest);
    return;
  }
  res.send({ done: true });
}
//To update fines for supple
export async function updateFine(req: Request, res: Response) {
    const semChar:string =req.body.semChar
    const fine1:number =req.body.fine1
    const fine2:number =req.body.fine2
    const fine3:number =req.body.fine3
    const fine1date:string =req.body.fine1date
    const fine2date:string=req.body.fine2date
    const fine3date:string=req.body.fine3date
    const nofinedate:string=req.body.nofinedate
    if (isAnyUndefined(semChar,fine1,fine2,fine3,fine1date,fine2date,fine3date,nofinedate)) {
      res.status(400).json(responses.NotAllParamsGiven);
      return;
    }
    try{
        await dbQuery(`REPLACE INTO fines VALUES ('${semChar}',${fine1},${fine2},${fine3}
        ,'${fine1date}','${fine2date}' ,'${fine3date}','${nofinedate}')`)
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
