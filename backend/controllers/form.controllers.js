import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Generate a unique slug for a form */
const generateSlug = () => nanoid(10);

/** Verify the caller is at least an EDITOR in the form's workspace */
const assertWorkspaceAccess = async (formId, userId, minRole = ["OWNER", "EDITOR", "VIEWER"]) => {
  const form = await client.form.findUnique({
    where: { id: formId },
    select: { workspaceId: true },
  });
  if (!form) throw new AppError("Form not found", 404);

  const member = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
  });
  if (!member || !minRole.includes(member.role)) {
    throw new AppError("Access denied", 403);
  }
  return form;
};

// ─────────────────────────────────────────────
//  FORM CRUD
// ─────────────────────────────────────────────

/**
 * GET /workspaces/:workspaceId/forms
 * List all forms in a workspace (with response count)
 */
export const getForms = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { workspaceId } = req.params;

    // verify membership
    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new AppError("Access denied", 403);

    const forms = await client.form.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { responses: true, blocks: true } },
        settings: {
          select: {
            primaryColor: true,
            hideBranding: true,
            maxResponses: true,
            closedAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: forms });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /workspaces/:workspaceId/forms
 * Create a new form (with auto-created FormSettings)
 */
export const createForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { workspaceId } = req.params;
    const { title, description, logoUrl, coverUrl } = req.body;

    // verify at least EDITOR
    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);

    // keep generating slug until unique
    let slug = generateSlug();
    let slugExists = await client.form.findUnique({ where: { slug } });
    while (slugExists) {
      slug = generateSlug();
      slugExists = await client.form.findUnique({ where: { slug } });
    }

    const form = await client.form.create({
      data: {
        title: title || "Untitled form",
        description,
        logoUrl,
        coverUrl,
        slug,
        workspaceId,
        // Auto-create default settings
        settings: {
          create: {},
        },
      },
      include: { settings: true },
    });

    res.status(201).json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /forms/:id
 * Get a single form with all blocks and settings
 */
export const getForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const form = await client.form.findUnique({
      where: { id: req.params.id },
      include: {
        blocks: { orderBy: { order: "asc" } },
        settings: true,
        _count: { select: { responses: true } },
      },
    });
    if (!form) throw new AppError("Form not found", 404);

    // verify workspace membership
    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member) throw new AppError("Access denied", 403);

    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /forms/slug/:slug  (PUBLIC — used by the form renderer)
 * Returns form + blocks for public rendering
 * Checks: published, not closed, response limit not hit, password
 */
export const getFormBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { password } = req.query; // ?password=xxx for password-protected forms

    const form = await client.form.findUnique({
      where: { slug },
      include: {
        blocks: { orderBy: { order: "asc" } },
        settings: true,
      },
    });
    if (!form) throw new AppError("Form not found", 404);

    // Must be published
    if (form.status !== "PUBLISHED") {
      throw new AppError("This form is not available", 403);
    }

    const settings = form.settings;

    // Check scheduled close date
    if (settings?.closedAt && new Date() > new Date(settings.closedAt)) {
      return res.status(410).json({
        success: false,
        code: "FORM_CLOSED",
        message: "This form is no longer accepting responses",
      });
    }

    // Check response cap
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

    // Password protection
    if (settings?.passwordHash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          code: "PASSWORD_REQUIRED",
          message: "This form is password protected",
        });
      }
      const valid = await bcrypt.compare(password, settings.passwordHash);
      if (!valid) {
        return res.status(401).json({
          success: false,
          code: "WRONG_PASSWORD",
          message: "Incorrect password",
        });
      }
    }

    // Strip internal fields (passwordHash etc.) before sending to public
    const { settings: s, ...publicForm } = form;
    const publicSettings = s
      ? {
          // Behaviour
          submitButtonLabel:        s.submitButtonLabel,
          thankYouMessage:          s.thankYouMessage,
          redirectUrl:              s.redirectUrl,
          allowMultipleSubmissions: s.allowMultipleSubmissions,
          requireLogin:             s.requireLogin,
          // Theme — every field the renderer needs
          primaryColor: s.primaryColor  ?? "#2563eb",
          bgColor:      s.bgColor       ?? "#ffffff",
          textColor:    s.textColor     ?? "#111827",
          fontFamily:   s.fontFamily    ?? "Inter",
          coverUrl:     s.coverUrl      ?? null,
          logoUrl:      s.logoUrl       ?? null,
          borderRadius: s.borderRadius  ?? "md",
          progressBar:  s.progressBar   ?? true,
          hideBranding: s.hideBranding,
        }
      : null;

    res.json({ success: true, data: { ...publicForm, settings: publicSettings } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /forms/:id
 * Update form metadata (title, description, status, coverUrl, logoUrl)
 */
export const updateForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertWorkspaceAccess(req.params.id, userId, ["OWNER", "EDITOR"]);

    const { title, description, logoUrl, coverUrl, status } = req.body;

    const updated = await client.form.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(status !== undefined && { status }),
      },
      include: { settings: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /forms/:id
 */
export const deleteForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertWorkspaceAccess(req.params.id, userId, ["OWNER", "EDITOR"]);

    await client.form.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: "Form deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /forms/:id/duplicate
 * Deep-clone a form (blocks + settings) into the same workspace
 */
export const duplicateForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertWorkspaceAccess(req.params.id, userId, ["OWNER", "EDITOR"]);

    const source = await client.form.findUnique({
      where: { id: req.params.id },
      include: { blocks: true, settings: true },
    });
    if (!source) throw new AppError("Form not found", 404);

    let slug = generateSlug();
    let slugExists = await client.form.findUnique({ where: { slug } });
    while (slugExists) {
      slug = generateSlug();
      slugExists = await client.form.findUnique({ where: { slug } });
    }

    const { id, createdAt, updatedAt, blocks, settings, ...formData } = source;

    const newForm = await client.form.create({
      data: {
        ...formData,
        title: `${source.title} (Copy)`,
        slug,
        status: "DRAFT",
        blocks: {
          create: blocks.map(({ id, formId, createdAt, updatedAt, ...b }) => b),
        },
        settings: settings
          ? {
              create: (({ id, formId, createdAt, updatedAt, ...s }) => s)(settings),
            }
          : { create: {} },
      },
      include: { blocks: { orderBy: { order: "asc" } }, settings: true },
    });

    res.status(201).json({ success: true, data: newForm });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /forms/:id/publish  — toggle PUBLISHED / DRAFT
 */
export const publishForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertWorkspaceAccess(req.params.id, userId, ["OWNER", "EDITOR"]);

    const form = await client.form.findUnique({ where: { id: req.params.id } });
    if (!form) throw new AppError("Form not found", 404);

    const newStatus = form.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    const updated = await client.form.update({
      where: { id: req.params.id },
      data: { status: newStatus },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  FORM SETTINGS
// ─────────────────────────────────────────────

/**
 * PATCH /forms/:id/settings
 * Update form settings (behaviour, notifications, limits, branding, password)
 */
export const updateFormSettings = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    await assertWorkspaceAccess(req.params.id, userId, ["OWNER", "EDITOR"]);

    const {
      allowMultipleSubmissions,
      requireLogin,
      submitButtonLabel,
      redirectUrl,
      thankYouMessage,
      notifyOwnerEmail,
      notificationEmails,
      maxResponses,
      closedAt,
      hideBranding,
      primaryColor,
      password, // plain text — will be hashed
    } = req.body;

    const updateData = {
      ...(allowMultipleSubmissions !== undefined && { allowMultipleSubmissions }),
      ...(requireLogin !== undefined && { requireLogin }),
      ...(submitButtonLabel !== undefined && { submitButtonLabel }),
      ...(redirectUrl !== undefined && { redirectUrl }),
      ...(thankYouMessage !== undefined && { thankYouMessage }),
      ...(notifyOwnerEmail !== undefined && { notifyOwnerEmail }),
      ...(notificationEmails !== undefined && { notificationEmails }),
      ...(maxResponses !== undefined && { maxResponses }),
      ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
      ...(hideBranding !== undefined && { hideBranding }),
      ...(primaryColor !== undefined && { primaryColor }),
    };

    // Hash password if provided; null clears the protection
    if (password !== undefined) {
      updateData.passwordHash = password ? await bcrypt.hash(password, 10) : null;
    }

    const settings = await client.formSettings.update({
      where: { formId: req.params.id },
      data: updateData,
    });

    // Never return the hash to the client
    const { passwordHash, ...safeSettings } = settings;
    res.json({ success: true, data: safeSettings });
  } catch (err) {
    next(err);
  }
};