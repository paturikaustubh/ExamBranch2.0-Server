import { Router } from "express"; 
import { downloadHandler } from "./controller";
 
const router: Router = Router(); 
 
// Registering all the module routes here
router.get("table/:tableName", downloadHandler);

 
export default router; 
