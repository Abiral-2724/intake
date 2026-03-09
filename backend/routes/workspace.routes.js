import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
} from "../controllers/workspace.controllers.js";

const router = Router();

// ── Workspace CRUD ───────────────────────────────────────────
router.get("/workspaces", getWorkspaces);
router.post("/workspaces", createWorkspace);
router.get("/workspaces/:id", getWorkspace);
router.patch("/workspaces/:id", updateWorkspace);
router.delete("/workspaces/:id", deleteWorkspace);

// ── Workspace members ────────────────────────────────────────
router.post("/workspaces/:id/members", addMember);
router.delete("/workspaces/:id/members/:userId", removeMember);

export default router;