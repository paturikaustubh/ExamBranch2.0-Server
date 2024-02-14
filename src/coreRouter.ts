import { Router } from "express";
import loginRouter from "./login";

const router = Router();

// Collecting all the module routes
router.use("/", loginRouter);

export default router;