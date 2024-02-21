import { Router, Request, Response, NextFunction } from "express";

import loginRouter from "./login";
import uploadRouter from "./upload";
import supplyRouter from "./supply";
import revalRouter from "./reval";
import cbtRouter from "./cbt";
import downloadRouter from "./download";
import { verifyToken } from "./login/controller";

const router = Router();

router.use("/", loginRouter);

router.use(verifyToken) // comment this to bypass login 
router.use("/", uploadRouter);
router.use("/", supplyRouter);
router.use("/", revalRouter);
router.use("/", cbtRouter);
router.use("/", downloadRouter);

export default router;