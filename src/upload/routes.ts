import { Router } from "express";

import {
  restoreStudentInfo,
  uploadHandler,
  uploadStudentInfo,
  uploadCBTSubjects,
} from "./controller";

const router: Router = Router();

router.post("/results", uploadStudentInfo);

router.post("/table/:tableName", uploadHandler);

// restoring backup file
router.post("/studentinfo", restoreStudentInfo);

router.post("/cbtsubjects", uploadCBTSubjects);

export default router;
