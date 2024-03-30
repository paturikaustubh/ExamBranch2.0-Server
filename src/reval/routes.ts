import { Router } from "express";
import {
  printReval,
  registerReval,
  revalSearch,
  deleteFromReval,
} from "./controller";

const router: Router = Router();

// Registering all the Revaluation module routes

router.get("/search", revalSearch);

router.post("/print/:rollNo", printReval);

router.post("/paid/:rollNo", registerReval);

router.delete("", deleteFromReval);

export default router;
