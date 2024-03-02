import { Router } from "express";
import { printReval, registerReval, revalSearch } from "./controller";

const router: Router = Router();

// Registering all the Revaluation module routes

router.get("/search", revalSearch);

router.post("/print/:rollNo", printReval);

router.post("/register/:rollNo", registerReval);

export default router;
