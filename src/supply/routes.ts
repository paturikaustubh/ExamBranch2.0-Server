import { Router } from "express";
import { printSupple, suppleSearch, paidSupple, deleteFromSupple } from "./controller";

const router: Router = Router();

//To search fail subjects of that particular roll number
router.get("/search", suppleSearch);
//For Inserting values into printSupple
router.post("/print/:rollNo", printSupple);
//For Inserting values into paidSupple and delete those entries in printsupple
router.post("/paid/:rollNo", paidSupple);
//deleting paid and printSupple
router.delete("/paid", deleteFromSupple);

// Registering all the supple module routes

export default router;
