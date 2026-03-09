import { Router } from "express";
import {
  submitResponse,
  getResponses,
  getResponse,
  deleteResponse,
  clearAllResponses,
  getResponseSummary,
} from "../controllers/response.controllers.js";

const router = Router();

// ── Public submission endpoint (no auth) ─────────────────────
router.post("/forms/:slug/submit", submitResponse);

// ── Response management (workspace members) ──────────────────
router.get("/forms/:formId/responses", getResponses);
router.get("/forms/:formId/responses/summary", getResponseSummary);   // before /:responseId
router.get("/forms/:formId/responses/:responseId", getResponse);
router.delete("/forms/:formId/responses", clearAllResponses);
router.delete("/forms/:formId/responses/:responseId", deleteResponse);

export default router;