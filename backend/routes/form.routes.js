import { Router } from "express";
import {
  getForms,
  createForm,
  getForm,
  getFormBySlug,
  updateForm,
  deleteForm,
  duplicateForm,
  publishForm,
  updateFormSettings,
} from "../controllers/form.controllers.js";

const router = Router();

// ── Workspace-scoped form routes ─────────────────────────────
// List + create forms inside a workspace
router.get("/workspaces/:workspaceId/forms", getForms);
router.post("/workspaces/:workspaceId/forms", createForm);

// ── Form-level routes ────────────────────────────────────────
router.get("/forms/:id", getForm);
router.patch("/forms/:id", updateForm);
router.delete("/forms/:id", deleteForm);
router.post("/forms/:id/duplicate", duplicateForm);
router.patch("/forms/:id/publish", publishForm);
router.patch("/forms/:id/settings", updateFormSettings);

// ── Public form renderer (no auth required) ──────────────────
router.get("/forms/slug/:slug", getFormBySlug);

export default router;