import { Router } from "express";
import loginRouter from "./routes";

const router = Router();

// Defining the core path from which this module should be accessed
router.use("/login", loginRouter)

export default router;