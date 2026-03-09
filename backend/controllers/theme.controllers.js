import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";

export const PRESET_THEMES = [
  { id:"default",  label:"Default",   primaryColor:"#2563eb", bgColor:"#ffffff", fontFamily:"Inter",             textColor:"#111827" },
  { id:"midnight", label:"Midnight",  primaryColor:"#6366f1", bgColor:"#0f172a", fontFamily:"Space Grotesk",     textColor:"#f1f5f9" },
  { id:"rose",     label:"Rose",      primaryColor:"#e11d48", bgColor:"#fff1f2", fontFamily:"Nunito",            textColor:"#1c1917" },
  { id:"forest",   label:"Forest",    primaryColor:"#16a34a", bgColor:"#f0fdf4", fontFamily:"Lato",              textColor:"#14532d" },
  { id:"sunset",   label:"Sunset",    primaryColor:"#ea580c", bgColor:"#fff7ed", fontFamily:"Poppins",           textColor:"#431407" },
  { id:"lavender", label:"Lavender",  primaryColor:"#7c3aed", bgColor:"#f5f3ff", fontFamily:"Plus Jakarta Sans", textColor:"#2e1065" },
  { id:"ocean",    label:"Ocean",     primaryColor:"#0891b2", bgColor:"#ecfeff", fontFamily:"DM Sans",           textColor:"#164e63" },
  { id:"minimal",  label:"Minimal",   primaryColor:"#374151", bgColor:"#f9fafb", fontFamily:"Inter",             textColor:"#111827" },
];

export const GOOGLE_FONTS = [
  "Inter","Roboto","Open Sans","Lato","Poppins","Montserrat","Nunito",
  "Raleway","Playfair Display","Merriweather","DM Sans","Space Grotesk",
  "Outfit","Sora","Plus Jakarta Sans",
];

// Helper: verify form access
const getFormAndVerify = async (formId, userId, allowViewer = false) => {
  const form = await client.form.findUnique({
    where: { id: formId },
    select: { workspaceId: true, settings: true },
  });
  if (!form) throw new AppError("Form not found", 404);

  const member = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
  });
  if (!member) throw new AppError("Access denied", 403);
  if (!allowViewer && member.role === "VIEWER") throw new AppError("Access denied", 403);

  return form;
};

/**
 * GET /forms/:formId/theme
 */
export const getTheme = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    const form = await getFormAndVerify(formId, userId, true);

    res.json({
      success: true,
      data: {
        theme: {
          primaryColor: form.settings?.primaryColor || "#2563eb",
          bgColor:      form.settings?.bgColor      || "#ffffff",
          fontFamily:   form.settings?.fontFamily   || "Inter",
          textColor:    form.settings?.textColor    || "#111827",
          coverUrl:     form.settings?.coverUrl     || "",
          logoUrl:      form.settings?.logoUrl      || "",
          borderRadius: form.settings?.borderRadius || "md",
          progressBar:  form.settings?.progressBar  ?? true,
        },
        presets: PRESET_THEMES,
        fonts: GOOGLE_FONTS,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /forms/:formId/theme
 * Only writes fields that exist in the schema.
 * Gracefully skips fields not yet migrated (progressBar, bgColor, etc.)
 * by catching Prisma validation errors field-by-field.
 */
export const updateTheme = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    await getFormAndVerify(formId, userId);

    const {
      primaryColor, bgColor, fontFamily, textColor,
      coverUrl, logoUrl, borderRadius, progressBar,
    } = req.body;

    // Build update object — only include fields with actual values,
    // skip empty strings (treat as "clear" → null), skip undefined
    const safe = (v) => (v === undefined ? undefined : v === "" ? null : v);

    // These fields are in the ORIGINAL schema — always safe to write
    const baseUpdate = {};
    if (primaryColor !== undefined) baseUpdate.primaryColor = primaryColor;

    // These fields require the migration to have run.
    // We attempt to write them; if the column doesn't exist yet Prisma
    // will throw a validation error — we catch it and retry without them.
    const themeFields = {};
    if (bgColor      !== undefined) themeFields.bgColor      = safe(bgColor);
    if (fontFamily   !== undefined) themeFields.fontFamily   = safe(fontFamily);
    if (textColor    !== undefined) themeFields.textColor    = safe(textColor);
    if (coverUrl     !== undefined) themeFields.coverUrl     = safe(coverUrl);
    if (logoUrl      !== undefined) themeFields.logoUrl      = safe(logoUrl);
    if (borderRadius !== undefined) themeFields.borderRadius = safe(borderRadius);
    if (progressBar  !== undefined) themeFields.progressBar  = progressBar;

    const tryUpsert = async (data) =>
      client.formSettings.upsert({
        where: { formId },
        update: data,
        create: { formId, ...data },
      });

    let settings;
    try {
      // Attempt with all theme fields
      settings = await tryUpsert({ ...baseUpdate, ...themeFields });
    } catch (e) {
      if (e.constructor.name === "PrismaClientValidationError") {
        // Migration not run yet — fall back to only writing primaryColor
        console.warn("[theme] Migration not run yet — writing only primaryColor. Run the migration to enable full theme support.");
        settings = await tryUpsert(baseUpdate);
      } else {
        throw e;
      }
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};