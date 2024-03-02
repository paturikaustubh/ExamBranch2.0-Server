import { Router, Request, Response, NextFunction } from "express";

import loginRouter from "./login";
import supplyRouter from "./supply";
import revalRouter from "./reval";
import cbtRouter from "./cbt";
import downloadRouter from "./download";
import { verifyToken } from "./login/controller";
import manageRouter from "./manage";
import costRouter from "./cost";
import uploadRouter from "./upload";

const router = Router();

router.use("/", loginRouter);

// router.use(verifyToken); // comment this to bypass login
// router.use("/", uploadRouter);
router.use("/", supplyRouter);
router.use("/", revalRouter);
router.use("/", cbtRouter);
router.use("/", downloadRouter);
router.use("/", manageRouter);
router.use("/", costRouter);

export default router;
