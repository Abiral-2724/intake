import { Router } from "express";
import {
  generateFormWithAI,
  generateFullFormWithAI,
  chatWithAssistant,
  analyseResponses,
  getSmartInsights,
  suggestBlocks,
  applySuggestion,
  translateForm,
} from "../controllers/ai.controller.js";

const router = Router();

// ── Existing ─────────────────────────────────────────────────────
router.post("/forms/:formId/ai-generate",      generateFormWithAI);
router.post("/forms/:formId/ai-generate-full", generateFullFormWithAI);
router.post("/ai/chat",                        chatWithAssistant);

// ── New AI features ───────────────────────────────────────────────
router.post("/forms/:formId/ai/analyse",         analyseResponses);   // Response Analyser
router.post("/forms/:formId/ai/insights",        getSmartInsights);   // Smart Insights
router.post("/forms/:formId/ai/suggest-blocks",  suggestBlocks);      // Block Suggestions
router.post("/forms/:formId/ai/apply-suggestion",applySuggestion);    // Apply a suggestion
router.post("/forms/:formId/ai/translate",       translateForm);      // Auto-translate

export default router;