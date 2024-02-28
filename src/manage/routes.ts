import { Router } from "express";

import { getStdDetails, editStdDetails, addStdDetails, deleteStdDetails , addUser, deleteUser, updateUser } from "./controller";


const router: Router = Router();

// Registering all the Manage DataBase module routes


// Getting Paid and Student Details 
router.get("/database/student-info", getStdDetails);
// Edit Student Details
router.patch("/database/student-info/:rollNum", editStdDetails);
// Add Student Details
router.post("/database/student-info/:rollNum", addStdDetails);
// Deleting Student Details 
router.delete("/database/student-info/:rollNum", deleteStdDetails);
// Adding a User
router.post("/user", addUser);
// Deleting a User
router.delete("/user", deleteUser );
// Updating the username
router.patch("/user", updateUser);


export default router;