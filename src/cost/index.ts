import { Router } from "express";
import costRouter from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/cost", costRouter)

export default router;