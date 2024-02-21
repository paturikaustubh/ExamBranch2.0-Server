import { Router } from "express";
import { printReval, registerReval, revalSearch } from "./controller";


const router: Router = Router();

// Registering all the Revaluation module routes

router.get("/:rollNum", revalSearch);

router.post("/print/:rollNum", printReval);

router.post("/register/:rollNum", registerReval);




export default router;