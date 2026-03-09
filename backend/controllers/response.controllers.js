import { AppError } from "../middleware/errorHandler.js";
import { pushResponseToIntegrations } from "./intergation.controller.js";
import client from "../prisma.js";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Get client IP from request */
const getClientIP = (req) =>
  req.headers["cf-connecting-ip"] ||
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.headers["x-real-ip"] ||
  req.connection?.remoteAddress ||
  "unknown";

// ─────────────────────────────────────────────
//  SUBMIT RESPONSE (PUBLIC)
// ─────────────────────────────────────────────

/**
 * POST /forms/:slug/responses
 * Submit a response to a published form.
 *
 * Body:
 * {
 *   answers: [{ blockId: "uuid", value: <any> }],
 *   userId?: "uuid",            // if requireLogin = true
 *   password?: "string",        // if form is password-protected
 *   fingerprint?: "string"      // browser fingerprint for no-login dedup
 * }
 */
export const submitResponse = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { answers, userId, password, fingerprint } = req.body;

    // ── 1. Load form + settings + blocks ──
    const form = await client.form.findUnique({
      where: { slug },
      include: {
        settings: true,
        blocks: { orderBy: { order: "asc" } },
      },
    });

    if (!form) throw new AppError("Form not found", 404);
    if (form.status !== "PUBLISHED") throw new AppError("This form is not accepting responses", 403);

    const settings = form.settings;

    // ── 2. Scheduled close date ──
    if (settings?.closedAt && new Date() > new Date(settings.closedAt)) {
      return res.status(410).json({
        success: false,
        code: "FORM_CLOSED",
        message: "This form is no longer accepting responses",
      });
    }

    // ── 3. Response cap ──
    if (settings?.maxResponses) {
      const count = await client.response.count({ where: { formId: form.id } });
      if (count >= settings.maxResponses) {
        return res.status(410).json({
          success: false,
          code: "RESPONSE_LIMIT_REACHED",
          message: "This form has reached its response limit",
        });
      }
    }

    // ── 4. Password protection ──
    if (settings?.passwordHash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          code: "PASSWORD_REQUIRED",
          message: "This form requires a password",
        });
      }
      const valid = await bcrypt.compare(password, settings.passwordHash);
      if (!valid) throw new AppError("Incorrect password", 401);
    }

    // ── 5. Login requirement ──
    if (settings?.requireLogin && !userId) {
      return res.status(401).json({
        success: false,
        code: "LOGIN_REQUIRED",
        message: "You must be logged in to submit this form",
      });
    }

    // ── 6. Duplicate submission check ──
    if (!settings?.allowMultipleSubmissions) {
      // Check by userId if logged in
      if (userId) {
        const existing = await client.response.findFirst({
          where: { formId: form.id, userId },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            code: "ALREADY_SUBMITTED",
            message: "You have already submitted this form",
          });
        }
      }

      // Check by browser fingerprint if provided (covers anonymous users)
      if (fingerprint) {
        const existing = await client.response.findFirst({
          where: {
            formId: form.id,
            metadata: { path: ["fingerprint"], equals: fingerprint },
          },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            code: "ALREADY_SUBMITTED",
            message: "You have already submitted this form",
          });
        }
      }
    }

    // ── 7. Validate required blocks are answered ──
    // The frontend sends ONLY visible question block answers (respecting conditional
    // logic). So we validate only against the blockIds that were actually submitted.
    const answeredBlockIds = new Set((answers ?? []).map((a) => a.blockId));
    const validBlockIds    = new Set(form.blocks.map((b) => b.id));

    // Required blocks that were submitted but have an empty/null value
    const submittedRequired = form.blocks.filter(
      (b) => b.required && answeredBlockIds.has(b.id)
    );
    const missingValues = submittedRequired.filter((b) => {
      const ans = (answers ?? []).find((a) => a.blockId === b.id);
      if (!ans) return true;
      const v = ans.value;
      return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
    });

    if (missingValues.length > 0) {
      return res.status(422).json({
        success: false,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Some required fields are not answered",
        missingBlockIds: missingValues.map((b) => b.id),
      });
    }

    // ── 8. Validate all submitted blockIds belong to this form ──
    const invalidBlocks = (answers ?? []).filter((a) => !validBlockIds.has(a.blockId));
    if (invalidBlocks.length > 0) {
      throw new AppError("Some block IDs are invalid for this form", 400);
    }

    // ── 9. Build metadata ──
    const metadata = {
      ip: getClientIP(req),
      userAgent: req.headers["user-agent"] ?? null,
      referrer: req.headers["referer"] ?? null,
      submittedAt: new Date().toISOString(),
      ...(fingerprint && { fingerprint }),
    };

    // ── 10. Persist response + answers ──
    // Avoid $transaction entirely — all validation is already done above,
    // so a single nested create is atomic enough and avoids the 5 s timeout.
    const response = await client.response.create({
      data: {
        formId: form.id,
        userId: userId ?? null,
        isComplete: true,
        metadata,
        answers: {
          create: (answers ?? []).map((a) => ({
            blockId: a.blockId,
            value: a.value,
          })),
        },
      },
      include: { answers: true },
    });

    // ── 11. Push to integrations (fire-and-forget) ──
    // Load the full response count so we can pass the index
    const responseCount = await client.response.count({ where: { formId: form.id } });
    const answersWithBlocks = await client.answer.findMany({
      where: { responseId: response.id },
      include: { block: { select: { id: true, type: true, label: true, order: true } } },
    });
    pushResponseToIntegrations(form.id, {
      answers: answersWithBlocks,
      submittedAt: new Date().toISOString(),
      index: responseCount,
      isComplete: true,
    }).catch(err => console.error("[integration push error]", err.message));

    // ── 12. Build the reply payload ──
    const replyPayload = {
      success: true,
      message: settings?.thankYouMessage || "Thank you for your response!",
      responseId: response.id,
    };

    if (settings?.redirectUrl) {
      replyPayload.redirectUrl = settings.redirectUrl;
    }

    res.status(201).json(replyPayload);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  RESPONSE MANAGEMENT (OWNER/EDITOR)
// ─────────────────────────────────────────────

/**
 * GET /forms/:formId/responses
 * List all responses (paginated). Workspace membership required.
 * Query params: page, limit, complete (true/false)
 */
export const getResponses = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;

    // verify access
    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member) throw new AppError("Access denied", 403);

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      formId,
      ...(req.query.complete !== undefined && {
        isComplete: req.query.complete === "true",
      }),
    };

    const [responses, total] = await Promise.all([
      client.response.findMany({
        where,
        include: {
          answers: {
            include: {
              block: { select: { id: true, type: true, label: true, order: true } },
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, profile: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      client.response.count({ where }),
    ]);

    res.json({
      success: true,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data: responses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /forms/:formId/responses/:responseId
 * Get a single response with all answers
 */
export const getResponse = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, responseId } = req.params;

    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member) throw new AppError("Access denied", 403);

    const response = await client.response.findUnique({
      where: { id: responseId },
      include: {
        answers: {
          include: {
            block: { select: { id: true, type: true, label: true, order: true, config: true } },
          },
          orderBy: { block: { order: "asc" } },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!response || response.formId !== formId) {
      throw new AppError("Response not found", 404);
    }

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /forms/:formId/responses/:responseId
 * Delete a single response (OWNER/EDITOR only)
 */
export const deleteResponse = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId, responseId } = req.params;

    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);

    await client.response.delete({ where: { id: responseId } });

    res.json({ success: true, message: "Response deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /forms/:formId/responses
 * Clear ALL responses for a form (OWNER only)
 */
export const clearAllResponses = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;

    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member || member.role !== "OWNER") throw new AppError("Only owners can clear all responses", 403);

    const { count } = await client.response.deleteMany({ where: { formId } });

    res.json({ success: true, message: `${count} response(s) deleted` });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /forms/:formId/responses/summary
 * Aggregate per-block answer summaries for the analytics dashboard.
 *
 * Returns per block:
 *   - totalAnswers
 *   - For choice blocks (MC, Checkboxes, Dropdown): count per option
 *   - For rating/linear: average value
 *   - For text: sample of last 5 answers
 */
export const getResponseSummary = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;

    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true, blocks: { orderBy: { order: "asc" } } },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member) throw new AppError("Access denied", 403);

    const totalResponses = await client.response.count({ where: { formId } });

    const CHOICE_TYPES = ["MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN", "MULTI_SELECT", "RANKING"];
    const NUMERIC_TYPES = ["RATING", "LINEAR_SCALE", "NUMBER"];
    const TEXT_TYPES = ["SHORT_ANSWER", "LONG_ANSWER", "EMAIL", "PHONE_NUMBER", "LINK"];

    const summaries = await Promise.all(
      form.blocks.map(async (block) => {
        const answers = await client.answer.findMany({
          where: { blockId: block.id },
          select: { value: true },
        });

        const base = {
          blockId: block.id,
          type: block.type,
          label: block.label,
          totalAnswers: answers.length,
        };

        if (CHOICE_TYPES.includes(block.type)) {
          const tally = {};
          answers.forEach(({ value }) => {
            const choices = Array.isArray(value) ? value : [value];
            choices.forEach((c) => {
              const key = String(c);
              tally[key] = (tally[key] || 0) + 1;
            });
          });
          return { ...base, distribution: tally };
        }

        if (NUMERIC_TYPES.includes(block.type)) {
          const nums = answers
            .map(({ value }) => Number(value))
            .filter((n) => !isNaN(n));
          const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
          return { ...base, average: avg ? Math.round(avg * 100) / 100 : null };
        }

        if (TEXT_TYPES.includes(block.type)) {
          return {
            ...base,
            samples: answers.slice(-5).map(({ value }) => value),
          };
        }

        return base;
      })
    );

    res.json({
      success: true,
      data: {
        totalResponses,
        blocks: summaries.filter(Boolean),
      },
    });
  } catch (err) {
    next(err);
  }
};