import { Router } from "express";

import { isUserValid } from "./controller";

const router: Router = Router();

// Registering all the login module routes
router.post("", isUserValid);

export default router;
