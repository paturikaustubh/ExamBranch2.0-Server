import { Router } from "express";
import supplyRouter from "./routes";

const router = Router();

router.use("/supply", supplyRouter)
export default router;