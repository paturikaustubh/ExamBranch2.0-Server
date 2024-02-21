import { Router } from "express";

import { getStdDetails, editStdDetails, addStdDetails, deleteStdDetails } from "./controller";


const router: Router = Router();

// Registering all the Manage DataBase module routes


// Getting Paid and Student Details 
router.get("/database/student-info/:rollNum", getStdDetails);
// Edit Student Details
router.patch("/database/student-info/:rollNum", editStdDetails);
// Add Student Details
router.post("/database/student-info/:rollNum", addStdDetails);
// Deleting Student Details 
router.delete("/database/student-info/:rollNum", deleteStdDetails);

export default router;