import { Response, Request } from "express";
import * as logger from "../services/logger";
import dbQuery from "../services/db";
import { isAnyUndefined, responses } from "../services/common";
import { Details, PrintSupply, StudentInfo, SubjectDetails } from "../interfaces/supply";


//Supply search
export async function supplySearch(req: Request, res: Response) {
    const rollno = req.params.rollno;
    if (isAnyUndefined(rollno)) {
        res.status(400).json({ error: responses.NotAllParamsGiven });
        return;
    }
    let year: number = 1, sem: number = 2;
    let semCode="A"
    let details:Details={};
    
    try {
        let printSupplyTable = await dbQuery(`select subName from printSupply where rollNo = '${rollno}'`) as PrintSupply[];
        // Checking whether the std is already in the print table for registration otherwise fetching std details from the studentInfo table which are not paid
        let query = (printSupplyTable.length > 0)?`select subCode, subName from printSupply where rollNo = ? and acYear = ? and sem = ?`:
        `select t.subCode,t.subName from studentInfo t LEFT JOIN paidSupply p ON t.subCode=p.subCode and t.rollNo=p.rollNo where t.rollNo=? and t.grade='F' and t.acYear=? and t.sem=? and p.subCode is null and p.rollNo is null`
        
        for (let i = 0; i < 8; i++) {
            sem=(sem==1)?2:1;
            let printSupplyTable = await dbQuery(query, [rollno, year, sem]) as StudentInfo[];               
            year=(i&1)?++year:year;
            let tempnames:string[]=[]
            let tempcodes:string[]=[]
            printSupplyTable.forEach((ele)=>{ 
                tempnames.push(ele.subName);
                tempcodes.push(ele.subCode);
            });
            let temp:SubjectDetails = {
                subCodes:tempcodes,
                subNames:tempnames,
            }
            details[semCode]=temp;
            semCode=String.fromCharCode(semCode.charCodeAt(0)+1);   
        }
        res.json({ subjectDetails:details, printTableExist: printSupplyTable.length>0 });
        
        return;
    } catch (err) {
        logger.log("error", err);
        res.json({ error: responses.ErrorWhileDBRequest });
    }
    
}

//insertion function into printSupply and paidSupply
async function insert(req:Request,table:boolean){
    const rollno:string = req.params.rollno;
    const userName:string = req.body.userName;
    let list:any=[req.body.A.subCodes,req.body.B.subCodes,req.body.C.subCodes,req.body.D.subCodes,req.body.E.subCodes,req.body.F.subCodes,req.body.G.subCodes,req.body.H.subCodes]
    if (isAnyUndefined(rollno, userName, ...list)) {
        throw responses.NotAllParamsGiven;
    }
    let semChar:string = "A" , year:number = 1,sem:number = 1
    //if table is true then insertion is performed into paidSupply else printSupply
    let table_name:string = table?"paidSupply":"printSupply"
    for(const semSubCodes of list){
        for(const subCode of semSubCodes){
            console.log(semSubCodes,subCode)
            try{
                let result:any=await dbQuery(`select distinct studentInfo.subName from studentInfo where studentInfo.subCode="${subCode}"`)
                if(result.length>0){
                    let subName=result[0]["subName"]
                    await dbQuery(`insert ignore into ${table_name}(rollNo, subCode, subName,acYear, sem, regDate,user) VALUES
                    ("${rollno}" ,"${subCode}","${subName}", ${year} ,${sem} ,curdate(),"${userName}")`)
                }
            }catch (err) {
                logger.log("error", err);
                throw responses.ErrorWhileDBRequestWithDone;
            }
        }
        semChar=String.fromCharCode(semChar.charCodeAt(0)+1);
        sem=(sem==1)?2:1;
        year=(sem&1)?++year:year;

    }

}

//For Inserting values into printSupply
export async function printSupply(req: Request, res: Response) {
    try{
        await insert(req,false)
        res.send({done:true});
    }
    catch(err){
        logger.log("error", err);
        res.status(500).json({error: responses.ErrorWhileDBRequestWithDone})
    }
}

//For Inserting values into paidSupply and delete those entries in printsupply

export async function paidSupply(req: Request, res: Response) {
    try{
        await insert(req,true)
        await dbQuery(`delete from printSupply where rollNo = "${req.params.rollno}"`)
        res.send({ done: true });
    }
    catch (err) {
        logger.log("error", err);
        return res.json({ error: responses.ErrorWhileDBRequestWithDone });
    }
}
