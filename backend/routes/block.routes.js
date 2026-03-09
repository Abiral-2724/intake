import { Router } from "express";
import {
  getBlocks,
  addBlock,
  updateBlock,
  deleteBlock,
  duplicateBlock,
  reorderBlocks,
  updateBlockLogic,
  getFormLogic,
} from "../controllers/block.controllers.js";

const router = Router();

// ── Block CRUD ───────────────────────────────────────────────
router.get("/forms/:formId/blocks", getBlocks);
router.post("/forms/:formId/blocks", addBlock);
router.patch("/forms/:formId/blocks/reorder", reorderBlocks);   // must be before /:blockId
router.patch("/forms/:formId/blocks/:blockId", updateBlock);
router.delete("/forms/:formId/blocks/:blockId", deleteBlock);
router.post("/forms/:formId/blocks/:blockId/duplicate", duplicateBlock);

// ── Conditional logic ────────────────────────────────────────
router.get("/forms/:formId/logic", getFormLogic);
router.patch("/forms/:formId/blocks/:blockId/logic", updateBlockLogic);

export default router;