import { Router } from "express";
import cbtRouter from "./routes";

const router = Router();

router.use("/cbt", cbtRouter)

export default router;