import { Router } from "express";
import { printSupply, supplySearch,paidSupply } from "./controller";

const router: Router = Router();

//To search fail subjects of that particular roll number
router.get("/:rollno",supplySearch)
//For Inserting values into printSupply
router.post("/print/:rollno",printSupply)
//For Inserting values into paidSupply and delete those entries in printsupply
router.post("/register/:rollno",paidSupply)

// Registering all the supply module routes


export default router;