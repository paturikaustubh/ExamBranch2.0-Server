import { Router } from "express";

import {
  getStdDetails,
  editStdDetails,
  addStdDetails,
  deleteStdDetails,
  addUser,
  deleteUser,
  updateUser,
} from "./controller";

const router: Router = Router();

// Registering all the Manage Database routes

// Getting Paid and Student Details
router.get("/database/search", getStdDetails);
// Edit Student Details
router.patch("/database/:rollNo", editStdDetails);
// Add Student Details
router.post("/database/:rollNo", addStdDetails);
// Deleting Student Details
router.delete("/database/:rollNo", deleteStdDetails);

// Registering all the Manage Users routes

// Adding a User
router.post("/user", addUser);
// Deleting a User
router.delete("/user", deleteUser);
// Updating the username
router.patch("/user", updateUser);

export default router;
