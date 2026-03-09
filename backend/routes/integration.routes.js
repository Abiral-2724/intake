import { Router } from "express";
import {
  getIntegrations,
  disconnectIntegration,
  notionOAuthStart,
  notionOAuthCallback,
  notionSetupDatabase,
  googleOAuthStart,
  googleOAuthCallback,
  googleSetupSheet,
  testPush,
  debugState,
} from "../controllers/intergation.controller.js";

const router = Router();

// ── Per-form integration management ─────────────────────────────
router.get("/forms/:formId/integrations", getIntegrations);
router.delete("/forms/:formId/integrations/:type", disconnectIntegration);

// ── Notion OAuth ─────────────────────────────────────────────────
router.post("/forms/:formId/integrations/notion/connect", notionOAuthStart);
router.get("/integrations/notion/callback", notionOAuthCallback);   // no formId — uses state
router.post("/forms/:formId/integrations/notion/setup", notionSetupDatabase);

// ── Google Sheets OAuth ──────────────────────────────────────────
router.post("/forms/:formId/integrations/google/connect", googleOAuthStart);
router.get("/integrations/google/callback", googleOAuthCallback);   // no formId — uses state
router.post("/forms/:formId/integrations/google/setup", googleSetupSheet);

// ── Debug/Test (remove in production) ───────────────────────────
router.post("/forms/:formId/integrations/test-push", testPush);
router.get("/integrations/debug-state", debugState);

export default router;