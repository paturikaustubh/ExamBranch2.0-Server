import { Router } from "express";

import { isUserValid } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.post("/valid", isUserValid);

export default router;