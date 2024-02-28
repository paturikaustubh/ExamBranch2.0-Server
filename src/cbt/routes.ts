import { Router } from "express";
import { searchCBT, printCBT, paidCBT, deleteFromCBT } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.get("/search", searchCBT);
router.post("/print/:rollNo", printCBT);
router.post("/paid/:rollNo", paidCBT);
router.delete("/paid", deleteFromCBT);


export default router;