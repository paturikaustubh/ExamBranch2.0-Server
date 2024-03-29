import { Router } from "express";
import supplyRouter from "./routes";

const router = Router();

router.use("/supple", supplyRouter);
export default router;
