import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Verify the caller has write access to the form via workspace membership */
const assertFormWriteAccess = async (formId, userId) => {
  const form = await client.form.findUnique({
    where: { id: formId },
    select: { workspaceId: true },
  });
  if (!form) throw new AppError("Form not found", 404);

  const member = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
  });
  if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);
  return form;
};

/**
 * Calculate the `order` value for a new block inserted at a given position.
 * Works like Notion/Linear's fractional indexing — no need to reindex siblings.
 *
 * Examples:
 *   Insert before first block:  order = firstBlock.order - 1000
 *   Insert after last block:    order = lastBlock.order  + 1000
 *   Insert between A and B:     order = (A.order + B.order) / 2
 */
const computeOrder = async (formId, afterBlockId) => {
  const blocks = await client.block.findMany({
    where: { formId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  if (blocks.length === 0) return 1000;

  if (!afterBlockId) {
    // Insert at the beginning
    return blocks[0].order - 1000;
  }

  const idx = blocks.findIndex((b) => b.id === afterBlockId);
  if (idx === -1) throw new AppError("afterBlockId not found in this form", 400);

  if (idx === blocks.length - 1) {
    // Insert at the end
    return blocks[idx].order + 1000;
  }

  // Insert between idx and idx+1
  return (blocks[idx].order + blocks[idx + 1].order) / 2;
};

// ─────────────────────────────────────────────
//  BLOCK CRUD
// ─────────────────────────────────────────────

/**
 * GET /forms/:formId/blocks
 * Return all blocks for a form, ordered by `order` asc
 */
export const getBlocks = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertFormWriteAccess(req.params.formId, userId);

    const blocks = await client.block.findMany({
      where: { formId: req.params.formId },
      orderBy: { order: "asc" },
    });

    res.json({ success: true, data: blocks });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /forms/:formId/blocks
 * Add a new block. Supports optional `afterBlockId` for inline insertion.
 *
 * Body: { type, label?, required?, config?, afterBlockId?, groupId? }
 */
export const addBlock = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    await assertFormWriteAccess(formId, userId);

    const { type, label, required, config, afterBlockId, groupId } = req.body;

    if (!type) throw new AppError("Block type is required", 400);

    const order = await computeOrder(formId, afterBlockId ?? null);

    const block = await client.block.create({
      data: {
        formId,
        type,
        label: label ?? "",
        required: required ?? false,
        config: config ?? {},
        groupId: groupId ?? null,
        order,
      },
    });

    // Touch the parent form's updatedAt
    await client.form.update({ where: { id: formId }, data: {} });

    res.status(201).json({ success: true, data: block });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /forms/:formId/blocks/:blockId
 * Update a single block (label, required, config, type, logic, groupId)
 */
export const updateBlock = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, blockId } = req.params;
    await assertFormWriteAccess(formId, userId);

    const { type, label, required, config, logic, groupId } = req.body;

    const updated = await client.block.update({
      where: { id: blockId },
      data: {
        ...(type !== undefined && { type }),
        ...(label !== undefined && { label }),
        ...(required !== undefined && { required }),
        ...(config !== undefined && { config }),
        ...(logic !== undefined && { logic }),
        ...(groupId !== undefined && { groupId }),
      },
    });

    await client.form.update({ where: { id: formId }, data: {} });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /forms/:formId/blocks/:blockId
 */
export const deleteBlock = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, blockId } = req.params;
    await assertFormWriteAccess(formId, userId);

    await client.block.delete({ where: { id: blockId } });
    await client.form.update({ where: { id: formId }, data: {} });

    res.json({ success: true, message: "Block deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /forms/:formId/blocks/:blockId/duplicate
 * Clone a block and insert it directly after the original
 */
export const duplicateBlock = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, blockId } = req.params;
    await assertFormWriteAccess(formId, userId);

    const source = await client.block.findUnique({ where: { id: blockId } });
    if (!source) throw new AppError("Block not found", 404);

    const order = await computeOrder(formId, blockId);

    const { id, createdAt, updatedAt, ...blockData } = source;

    const duplicate = await client.block.create({
      data: { ...blockData, order },
    });

    await client.form.update({ where: { id: formId }, data: {} });

    res.status(201).json({ success: true, data: duplicate });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /forms/:formId/blocks/reorder
 * Bulk reorder blocks.
 *
 * Body: { blocks: [{ id, order }] }
 * The client sends back the full ordered list after drag-and-drop;
 * we batch-update only the changed order values.
 */
export const reorderBlocks = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    await assertFormWriteAccess(formId, userId);

    const { blocks } = req.body;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new AppError("blocks array is required", 400);
    }

    // Validate all blocks belong to this form
    const existingIds = (
      await client.block.findMany({ where: { formId }, select: { id: true } })
    ).map((b) => b.id);

    const invalidIds = blocks.filter((b) => !existingIds.includes(b.id));
    if (invalidIds.length > 0) {
      throw new AppError("Some block IDs do not belong to this form", 400);
    }

    // Batch update using a transaction
    await client.$transaction(
      blocks.map((b) =>
        client.block.update({
          where: { id: b.id },
          data: { order: b.order },
        })
      )
    );

    await client.form.update({ where: { id: formId }, data: {} });

    // Return the updated order
    const updated = await client.block.findMany({
      where: { formId },
      orderBy: { order: "asc" },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  CONDITIONAL LOGIC
// ─────────────────────────────────────────────

/**
 * PATCH /forms/:formId/blocks/:blockId/logic
 * Set or clear conditional logic on a block.
 *
 * Logic schema (stored in block.logic Json):
 * {
 *   conditions: [
 *     {
 *       sourceBlockId: "uuid",
 *       operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty",
 *       value: "some value"
 *     }
 *   ],
 *   conditionOperator: "AND" | "OR",    // how to combine multiple conditions
 *   action: "show" | "hide" | "jump_to",
 *   targetBlockId: "uuid"               // block to show/hide/jump to
 * }
 */
export const updateBlockLogic = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, blockId } = req.params;
    await assertFormWriteAccess(formId, userId);

    const { logic } = req.body;

    // `null` clears the logic
    const updated = await client.block.update({
      where: { id: blockId },
      data: { logic: logic ?? null },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /forms/:formId/logic
 * Return ALL blocks that have conditional logic — useful for the logic overview panel
 */
export const getFormLogic = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertFormWriteAccess(req.params.formId, userId);

    const blocksWithLogic = await client.block.findMany({
      where: {
        formId: req.params.formId,
        NOT: { logic: null },
      },
      orderBy: { order: "asc" },
      select: { id: true, type: true, label: true, order: true, logic: true },
    });

    res.json({ success: true, data: blocksWithLogic });
  } catch (err) {
    next(err);
  }
};