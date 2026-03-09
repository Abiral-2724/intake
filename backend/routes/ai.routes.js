import { Router } from "express";
import { chatWithAssistant, generateFormWithAI, generateFullFormWithAI } from "../controllers/ai.controller.js";

const router = Router();

// Add blocks from a prompt (inline AI in editor)
router.post("/forms/:formId/ai-generate", generateFormWithAI);

// Replace entire form with AI-generated content
router.post("/forms/:formId/ai-generate-full", generateFullFormWithAI);

router.post("/ai/chat", chatWithAssistant);
export default router;