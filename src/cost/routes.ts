import { Router } from "express";
import { updateCost, updateFine,getCost, getFines } from "./controller";

const router: Router = Router();

//to update cost
router.patch("/costs",updateCost)

//to update fines in costs table in database
router.patch("/fines",updateFine)

//to get all values of costs table from database 
router.get("/costs",getCost)

//to get fine details
router.get("/fines",getFines)

// Registering all the cost module routes


export default router;