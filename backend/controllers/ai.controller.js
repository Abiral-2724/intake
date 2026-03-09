import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const VALID_BLOCK_TYPES = [
  "HEADING_1","HEADING_2","TEXT","DIVIDER",
  "SHORT_ANSWER","LONG_ANSWER","MULTIPLE_CHOICE","CHECKBOXES",
  "DROPDOWN","NUMBER","EMAIL","PHONE_NUMBER","LINK",
  "FILE_UPLOAD","DATE","TIME","RATING","LINEAR_SCALE",
];

/**
 * POST /forms/:formId/ai-generate
 * Body: { prompt: string }
 *
 * Gemini returns a JSON array of blocks. We insert them all
 * after the last existing block in the form.
 */
export const generateFormWithAI = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      throw new AppError("A prompt is required", 400);
    }

    // Verify form ownership / editor access
    const form = await client.form.findUnique({
      where: { id: formId },
      select: { workspaceId: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);

    // Get current last block order
    const lastBlock = await client.block.findFirst({
      where: { formId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let nextOrder = (lastBlock?.order ?? 0) + 1000;

    // ── Build Gemini prompt ──────────────────────────────────────
    const systemPrompt = `You are a form builder assistant. The user will describe what form fields they want.
Return ONLY a valid JSON array of block objects. No markdown, no explanation, no code fences.

Each block object must have:
- "type": one of ${VALID_BLOCK_TYPES.join(", ")}
- "label": string (the question text or heading text)
- "required": boolean
- "config": object (see below)

Config rules:
- MULTIPLE_CHOICE, CHECKBOXES, DROPDOWN: { "options": ["Option 1", "Option 2", ...] }
- RATING: { "maxRating": 5 }
- LINEAR_SCALE: { "min": 1, "max": 10, "minLabel": "Low", "maxLabel": "High" }
- SHORT_ANSWER, LONG_ANSWER, EMAIL, etc.: { "placeholder": "..." }
- HEADING_1, HEADING_2, TEXT, DIVIDER: { }

Example response:
[
  {"type":"HEADING_1","label":"Contact Us","required":false,"config":{}},
  {"type":"SHORT_ANSWER","label":"Your name","required":true,"config":{"placeholder":"John Doe"}},
  {"type":"EMAIL","label":"Email address","required":true,"config":{"placeholder":"you@example.com"}},
  {"type":"MULTIPLE_CHOICE","label":"How did you hear about us?","required":false,"config":{"options":["Google","Friend","Social media","Other"]}}
]`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User request: ${prompt.trim()}` },
    ]);

    const raw = result.response.text().trim();

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

    let generatedBlocks;
    try {
      generatedBlocks = JSON.parse(clean);
      if (!Array.isArray(generatedBlocks)) throw new Error("Not an array");
    } catch {
      throw new AppError("AI returned invalid JSON. Please try again.", 500);
    }

    // Sanitise each block
    const sanitised = generatedBlocks
      .filter((b) => VALID_BLOCK_TYPES.includes(b.type))
      .map((b) => ({
        formId,
        type: b.type,
        label: typeof b.label === "string" ? b.label.slice(0, 500) : "",
        required: Boolean(b.required),
        config: typeof b.config === "object" && b.config !== null ? b.config : {},
        logic: null,
      }));

    if (sanitised.length === 0) {
      throw new AppError("AI could not generate any valid blocks for that prompt.", 422);
    }

    // Insert all blocks in a transaction with fractional ordering
    const created = await client.$transaction(
      sanitised.map((block) => {
        const order = nextOrder;
        nextOrder += 1000;
        return client.block.create({ data: { ...block, order } });
      })
    );

    // Touch form updatedAt
    await client.form.update({ where: { id: formId }, data: {} });

    res.status(201).json({
      success: true,
      message: `Generated ${created.length} block(s)`,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /forms/:formId/ai-generate-full
 * Body: { prompt: string }
 *
 * Like above but ALSO updates the form title + description
 * based on the prompt (used for "generate a whole form" flow).
 */
export const generateFullFormWithAI = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);

    const { formId } = req.params;
    const { prompt } = req.body;

    if (!prompt?.trim()) throw new AppError("A prompt is required", 400);

    const form = await client.form.findUnique({ where: { id: formId }, select: { workspaceId: true } });
    if (!form) throw new AppError("Form not found", 404);

    const member = await client.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
    });
    if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);

    const systemPrompt = `You are a form builder assistant. The user describes a form they want to create.
Return ONLY a valid JSON object (no markdown, no explanation) with this shape:
{
  "title": "Form title",
  "description": "Short description of the form",
  "blocks": [
    {"type":"...","label":"...","required":true/false,"config":{...}}
  ]
}

Valid block types: ${VALID_BLOCK_TYPES.join(", ")}

Config rules:
- MULTIPLE_CHOICE, CHECKBOXES, DROPDOWN: { "options": ["A","B","C"] }
- RATING: { "maxRating": 5 }
- LINEAR_SCALE: { "min": 1, "max": 10, "minLabel": "Low", "maxLabel": "High" }
- All others: { "placeholder": "..." } or {}

Create a complete, sensible form matching the user's description.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User request: ${prompt.trim()}` },
    ]);

    const raw = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error();
    } catch {
      throw new AppError("AI returned invalid JSON. Please try again.", 500);
    }

    // Delete existing blocks
    await client.block.deleteMany({ where: { formId } });

    // Update form title/description
    await client.form.update({
      where: { id: formId },
      data: {
        title: parsed.title?.slice(0, 200) || "Untitled form",
        description: parsed.description?.slice(0, 500) || null,
      },
    });

    // Insert new blocks
    let order = 1000;
    const sanitised = (parsed.blocks || [])
      .filter((b) => VALID_BLOCK_TYPES.includes(b.type))
      .map((b) => ({
        formId,
        type: b.type,
        label: typeof b.label === "string" ? b.label.slice(0, 500) : "",
        required: Boolean(b.required),
        config: typeof b.config === "object" ? b.config : {},
        logic: null,
        order: (order += 1000) - 1000,
      }));

    const created = await client.$transaction(
      sanitised.map((b) => client.block.create({ data: b }))
    );

    const updatedForm = await client.form.findUnique({
      where: { id: formId },
      include: { blocks: { orderBy: { order: "asc" } }, settings: true },
    });

    res.status(201).json({ success: true, data: updatedForm });
  } catch (err) {
    next(err);
  }
};

// ── System prompt for AI Assistant chat ─────────────────────────
const ASSISTANT_SYSTEM_PROMPT = `You are Intake Assistant — a friendly, knowledgeable helper for Intake, a powerful form-building app.

Intake's key features:
- **Forms & Blocks**: Forms are built from "blocks". Block types: Short answer, Long answer, Multiple choice, Checkboxes, Dropdown, Email, Phone, Number, URL/Link, Date, Time, Rating (stars), Linear scale, File upload, Heading 1, Heading 2, Text (paragraph), Divider, Image.
- **Editor**: 4 tabs — Build (add/edit blocks), Settings (behaviour/limits/security), Logic (conditional rules), Themes (colors/fonts/branding).
- **Adding blocks**: Hover between blocks to reveal the "+" gutter button, or use "+ Add a block" at the bottom. Block picker has search and 19 block types.
- **AI generation**: "✨ AI generate" button generates a full form from a text prompt using Gemini AI. Also available inline in the block picker.
- **Conditional logic**: Logic tab — set "When [block] [operator] [value] → Show/Hide/Jump to [block]". Operators: equals, not equals, contains, is empty, is not empty, greater than, less than.
- **Themes**: 8 presets (Default, Midnight, Rose, Forest, Sunset, Lavender, Ocean, Minimal). Custom primary/bg/text colors, 15 Google Fonts, cover image URL, logo URL, border radius, progress bar toggle.
- **Settings**: Submit button label, thank you message, redirect URL, allow multiple submissions, require login, max responses, scheduled close date, password protection, email notifications.
- **Publishing**: "Publish" button top-right. Form URL is /f/[slug]. Share modal shows URL + copy button.
- **Responses**: Responses icon in editor toolbar → Summary view (charts) + individual responses. Can delete individual or clear all.
- **Templates**: 9+ pre-built templates (Contact Us, Customer Feedback, Job Application, Event Registration, Student Survey, Bug Report, Patient Intake, Product Order, Employee Onboarding).
- **Workspaces**: Forms live inside workspaces. Create from dashboard or sidebar "+".

Answer helpfully and concisely. Use markdown (bold, bullet lists) for readability. Keep answers focused on Intake — if asked something unrelated, gently redirect to Intake questions.`;

/**
 * POST /ai/chat
 * Body: { messages: [{ role: "user"|"model", content: string }] }
 * Public endpoint (no auth required — anyone using the assistant can ask questions)
 */
export const chatWithAssistant = async (req, res, next) => {
    try {
      const { messages } = req.body;
  
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new AppError("messages array is required", 400);
      }
  
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: ASSISTANT_SYSTEM_PROMPT,
      });
  
      // Convert messages to Gemini format (excluding last message)
      let history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
  
      // Ensure first message is from user (Gemini requirement)
      while (history.length && history[0].role !== "user") {
        history.shift();
      }
  
      const lastMessage = messages[messages.length - 1];
  
      if (!lastMessage || !lastMessage.content) {
        throw new AppError("Last message content is missing", 400);
      }
  
      const chat = model.startChat({
        history,
      });
  
      const result = await chat.sendMessage(lastMessage.content);
      const reply = result.response.text();
  
      res.json({
        success: true,
        reply,
      });
    } catch (err) {
      next(err);
    }
  };