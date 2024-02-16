import { Router } from "express";

import { uploadStudentInfo, uploadCBTSubjects } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.post("/studentinfo", uploadStudentInfo);
router.post("/cbtsubjects", uploadCBTSubjects);

export default router;