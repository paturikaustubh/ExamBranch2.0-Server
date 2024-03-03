import { Router } from "express";
import { downloadHandler, manageDBdownloadHandler } from "./controller";

const router: Router = Router();

// Registering all the module routes here
router.get("table/:tableName", downloadHandler);
router.get("/manage-db/:rollNo", manageDBdownloadHandler);

export default router;
