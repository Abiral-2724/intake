import { Router } from "express";
import { getTheme, updateTheme } from "../controllers/theme.controllers.js";

const router = Router();

router.get("/forms/:formId/theme", getTheme);
router.patch("/forms/:formId/theme", updateTheme);

export default router;