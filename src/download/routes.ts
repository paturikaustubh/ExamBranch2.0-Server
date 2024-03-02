import { Router } from "express"; 
import { downloadHandler, manageDBdownloadHandler } from "./controller";
 
const router: Router = Router(); 
 
// Registering all the module routes here
router.get("/table/:tableName", downloadHandler);
router.get("/manageDB/:rollNum", manageDBdownloadHandler);

 
export default router; 
