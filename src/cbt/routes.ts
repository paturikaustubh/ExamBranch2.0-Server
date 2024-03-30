import { Router } from "express";
import {
  searchCBT,
  printCBT,
  paidCBT,
  deleteFromCBT,
  distBranchs,
} from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.get("/search", searchCBT);
router.get("/branchs", distBranchs);
router.post("/print/:rollNo", printCBT);
router.post("/paid/:rollNo", paidCBT);
router.delete("", deleteFromCBT);

export default router;
