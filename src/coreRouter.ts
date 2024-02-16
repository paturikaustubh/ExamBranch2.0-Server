import { Router } from "express";

import loginRouter from "./login";
import uploadRouter from "./upload";
import supplyRouter from "./supply";
import revalRouter from "./reval";
import cbtRouter from "./cbt"

const router = Router();

// Collecting all the module routes
router.use("/", loginRouter);
router.use("/", uploadRouter);
router.use("/", supplyRouter);
router.use("/", revalRouter);
router.use("/", cbtRouter);

export default router;