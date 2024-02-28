import { Router } from "express";
import { updateCost, updateFine,getCost } from "./controller";

const router: Router = Router();

//to update cost
router.patch("/costs",updateCost)

//to update fines in costs table in database
router.patch("/fines",updateFine)

//to get all values of costs table from database 
router.get("/costs",getCost)

// Registering all the cost module routes


export default router;