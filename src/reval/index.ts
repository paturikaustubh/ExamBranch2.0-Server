import { Router } from "express";
import revalRouter from "./routes";

const router = Router();

router.use("/reval", revalRouter)

export default router;