import { Router } from "express";

import { isUserValid } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.get("", isUserValid);

export default router;
