import { Router } from "express";

import { getStdDetails, editStdDetails, addStdDetails, deleteStdDetails , addUser, deleteUser, updateUser } from "./controller";


const router: Router = Router();

// Registering all the Manage Database routes

// Getting Paid and Student Details 
router.get("/database/student-info", getStdDetails);
// Edit Student Details
router.patch("/database/student-info/:rollNo", editStdDetails);
// Add Student Details
router.post("/database/student-info/:rollNo", addStdDetails);
// Deleting Student Details 
router.delete("/database/student-info/:rollNo", deleteStdDetails);


// Registering all the Manage Users routes

// Adding a User
router.post("/user", addUser);
// Deleting a User
router.delete("/user", deleteUser );
// Updating the username
router.patch("/user", updateUser);


export default router;