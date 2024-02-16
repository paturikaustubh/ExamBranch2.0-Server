import { Router } from "express";

import { uploadStudentInfo } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.post("/studentinfo", uploadStudentInfo);

export default router;