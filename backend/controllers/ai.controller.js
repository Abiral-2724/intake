import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL  = "gemini-2.5-flash-lite";

const VALID_BLOCK_TYPES = [
  "HEADING_1","HEADING_2","TEXT","DIVIDER",
  "SHORT_ANSWER","LONG_ANSWER","MULTIPLE_CHOICE","CHECKBOXES",
  "DROPDOWN","NUMBER","EMAIL","PHONE_NUMBER","LINK",
  "FILE_UPLOAD","DATE","TIME","RATING","LINEAR_SCALE",
];

async function assertEditor(formId, userId) {
  const form = await client.form.findUnique({ where: { id: formId }, select: { workspaceId: true } });
  if (!form) throw new AppError("Form not found", 404);
  const member = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
  });
  if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);
  return form;
}

function gemini() { return genAI.getGenerativeModel({ model: MODEL }); }
function stripFences(raw) {
  return raw.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function loadResponseData(formId) {
  return client.response.findMany({
    where: { formId },
    include: {
      answers: {
        include: { block: { select: { id: true, type: true, label: true, order: true } } },
        orderBy: { block: { order: "asc" } },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 300,
  });
}

function buildResponseSummaryText(responses) {
  if (responses.length === 0) return "No responses yet.";
  return responses.map((r, i) => {
    const answers = r.answers.map(a => {
      const val = Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "");
      return `  ${a.block.label || a.block.type}: ${val}`;
    }).join("\n");
    return `Response #${i + 1} (${new Date(r.submittedAt).toLocaleDateString()}):\n${answers}`;
  }).join("\n\n");
}

// ════════════════════════════════════════════════════════════════
//  1. GENERATE BLOCKS
// ════════════════════════════════════════════════════════════════
export const generateFormWithAI = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    const { prompt } = req.body;
    if (!prompt?.trim()) throw new AppError("A prompt is required", 400);
    await assertEditor(formId, userId);

    const lastBlock = await client.block.findFirst({
      where: { formId }, orderBy: { order: "desc" }, select: { order: true },
    });
    let nextOrder = (lastBlock?.order ?? 0) + 1000;

    const systemPrompt = `You are a form builder assistant. Return ONLY a valid JSON array of block objects. No markdown, no explanation.
Each block: { "type": one of [${VALID_BLOCK_TYPES.join(",")}], "label": string, "required": boolean, "config": object }
Config: MULTIPLE_CHOICE/CHECKBOXES/DROPDOWN → { "options": [...] }, RATING → { "maxRating": 5 }, LINEAR_SCALE → { "min":1,"max":10,"minLabel":"Low","maxLabel":"High" }, others → { "placeholder": "..." }`;

    const model = gemini();
    const result = await model.generateContent([{ text: systemPrompt }, { text: `User request: ${prompt.trim()}` }]);
    const clean = stripFences(result.response.text());
    let generatedBlocks;
    try { generatedBlocks = JSON.parse(clean); if (!Array.isArray(generatedBlocks)) throw new Error(); }
    catch { throw new AppError("AI returned invalid JSON. Please try again.", 500); }

    const sanitised = generatedBlocks.filter(b => VALID_BLOCK_TYPES.includes(b.type)).map(b => ({
      formId, type: b.type, label: typeof b.label === "string" ? b.label.slice(0, 500) : "",
      required: Boolean(b.required), config: typeof b.config === "object" && b.config !== null ? b.config : {}, logic: null,
    }));
    if (sanitised.length === 0) throw new AppError("AI could not generate any valid blocks.", 422);

    const created = await client.$transaction(sanitised.map(block => {
      const order = nextOrder; nextOrder += 1000;
      return client.block.create({ data: { ...block, order } });
    }));
    await client.form.update({ where: { id: formId }, data: {} });
    res.status(201).json({ success: true, message: `Generated ${created.length} block(s)`, data: created });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  2. GENERATE FULL FORM
// ════════════════════════════════════════════════════════════════
export const generateFullFormWithAI = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    const { prompt } = req.body;
    if (!prompt?.trim()) throw new AppError("A prompt is required", 400);
    await assertEditor(formId, userId);

    const systemPrompt = `You are a form builder assistant. Return ONLY valid JSON: { "title": string, "description": string, "blocks": [{type, label, required, config}] }
Valid types: ${VALID_BLOCK_TYPES.join(", ")}. Config: MULTIPLE_CHOICE/CHECKBOXES/DROPDOWN → { "options": [...] }, RATING → { "maxRating": 5 }, LINEAR_SCALE → { "min":1,"max":10,"minLabel":"Low","maxLabel":"High" }, others → { "placeholder": "..." }`;

    const model = gemini();
    const result = await model.generateContent([{ text: systemPrompt }, { text: `User request: ${prompt.trim()}` }]);
    const raw = stripFences(result.response.text());
    let parsed;
    try { parsed = JSON.parse(raw); if (!parsed.blocks || !Array.isArray(parsed.blocks)) throw new Error(); }
    catch { throw new AppError("AI returned invalid JSON. Please try again.", 500); }

    await client.block.deleteMany({ where: { formId } });
    await client.form.update({ where: { id: formId }, data: { title: parsed.title?.slice(0, 200) || "Untitled form", description: parsed.description?.slice(0, 500) || null } });

    let order = 1000;
    const sanitised = (parsed.blocks || []).filter(b => VALID_BLOCK_TYPES.includes(b.type)).map(b => ({
      formId, type: b.type, label: typeof b.label === "string" ? b.label.slice(0, 500) : "",
      required: Boolean(b.required), config: typeof b.config === "object" ? b.config : {}, logic: null, order: (order += 1000) - 1000,
    }));

    await client.$transaction(sanitised.map(b => client.block.create({ data: b })));
    const updatedForm = await client.form.findUnique({ where: { id: formId }, include: { blocks: { orderBy: { order: "asc" } }, settings: true } });
    res.status(201).json({ success: true, data: updatedForm });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  3. AI ASSISTANT CHAT
// ════════════════════════════════════════════════════════════════
const ASSISTANT_SYSTEM_PROMPT = `You are Intake Assistant — a friendly helper for Intake, a form-building app.
Features: block types (Short answer, Long answer, Multiple choice, Checkboxes, Dropdown, Email, Phone, Number, Link, Date, Time, Rating, Linear scale, File upload, Headings, Text, Divider), Editor tabs (Build/Settings/Logic/Themes), AI generation, conditional logic, 8 themes, integrations (Notion, Google Sheets), AI features (Response Analyser, Smart Insights, Block Suggestions, Auto-translate), templates, workspaces.
Answer helpfully and concisely using markdown.`;

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
// ════════════════════════════════════════════════════════════════
//  4. RESPONSE ANALYSER
//  POST /forms/:formId/ai/analyse
// ════════════════════════════════════════════════════════════════
export const analyseResponses = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    const { question } = req.body;
    if (!question?.trim()) throw new AppError("A question is required", 400);
    await assertEditor(formId, userId);

    const form = await client.form.findUnique({ where: { id: formId }, select: { title: true, blocks: { orderBy: { order: "asc" } } } });
    const responses = await loadResponseData(formId);
    const totalResponses = await client.response.count({ where: { formId } });

    if (responses.length === 0) {
      return res.json({ success: true, answer: "This form has no responses yet. Once people start submitting, I can answer questions about the data.", responseCount: 0 });
    }

    const prompt = `You are an expert data analyst helping a form owner understand their response data.

Form: "${form.title}"
Total responses: ${totalResponses} (showing most recent ${responses.length})
Questions: ${form.blocks.filter(b => b.label).map(b => `${b.label} (${b.type})`).join(", ")}

Response data:
${buildResponseSummaryText(responses)}

Question: "${question.trim()}"

Provide a clear, insightful, concise answer. Cite specific numbers and percentages. Highlight patterns and findings. Use markdown formatting.`;

    const model = gemini();
    const result = await model.generateContent(prompt);
    res.json({ success: true, answer: result.response.text(), responseCount: responses.length, totalResponses });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  5. SMART INSIGHTS
//  POST /forms/:formId/ai/insights
// ════════════════════════════════════════════════════════════════
export const getSmartInsights = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertEditor(formId, userId);

    const form = await client.form.findUnique({ where: { id: formId }, select: { title: true, blocks: { orderBy: { order: "asc" } } } });
    const responses = await loadResponseData(formId);
    const totalResponses = await client.response.count({ where: { formId } });

    if (responses.length < 3) {
      return res.json({ success: true, insights: [], message: `Need at least 3 responses to generate insights. You have ${totalResponses} so far.`, responseCount: totalResponses });
    }

    const prompt = `You are an expert data analyst. Analyse these form responses and return insights as JSON.

Form: "${form.title}"
Questions: ${form.blocks.filter(b => b.label).map(b => `${b.label} (${b.type})`).join(", ")}
Total responses: ${totalResponses}

Response data:
${buildResponseSummaryText(responses)}

Return ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence executive summary",
  "insights": [
    {
      "type": "trend|anomaly|sentiment|popular|suggestion",
      "title": "Short title",
      "description": "1-2 sentences with specific numbers",
      "severity": "positive|neutral|warning",
      "metric": "optional short metric e.g. 73% positive"
    }
  ],
  "topFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["action 1", "action 2"]
}

Generate 4-8 insights. Be specific with numbers. Focus on actionable findings.`;

    const model = gemini();
    const result = await model.generateContent(prompt);
    const raw = stripFences(result.response.text());
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { throw new AppError("AI returned invalid JSON. Please try again.", 500); }

    res.json({ success: true, ...parsed, responseCount: responses.length, totalResponses });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  6. AI BLOCK SUGGESTIONS
//  POST /forms/:formId/ai/suggest-blocks
// ════════════════════════════════════════════════════════════════
export const suggestBlocks = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertEditor(formId, userId);

    const form = await client.form.findUnique({
      where: { id: formId },
      select: { title: true, description: true, blocks: { orderBy: { order: "asc" }, select: { type: true, label: true } } },
    });
    if (!form) throw new AppError("Form not found", 404);

    const existingBlocks = form.blocks.filter(b => b.label).map(b => `- ${b.label} (${b.type})`).join("\n") || "No blocks yet";

    const prompt = `You are an expert form designer. Suggest the best next questions to add to this form.

Form title: "${form.title}"
Form description: "${form.description || "none"}"
Current blocks:
${existingBlocks}

Valid types: ${VALID_BLOCK_TYPES.join(", ")}

Return ONLY valid JSON array of 4-6 suggestions:
[
  {
    "type": "BLOCK_TYPE",
    "label": "Question text",
    "required": true/false,
    "config": {},
    "reason": "1 sentence explaining why this is valuable"
  }
]

Config: MULTIPLE_CHOICE/CHECKBOXES/DROPDOWN → { "options": ["A","B","C"] } with realistic options, RATING → { "maxRating": 5 }, LINEAR_SCALE → { "min":1,"max":10,"minLabel":"Low","maxLabel":"High" }, others → { "placeholder": "..." }
Suggest questions relevant, not redundant, and genuinely useful for this form type.`;

    const model = gemini();
    const result = await model.generateContent(prompt);
    const raw = stripFences(result.response.text());
    let suggestions;
    try { suggestions = JSON.parse(raw); if (!Array.isArray(suggestions)) throw new Error(); }
    catch { throw new AppError("AI returned invalid suggestions. Please try again.", 500); }

    const clean = suggestions.filter(b => VALID_BLOCK_TYPES.includes(b.type)).map(b => ({
      type: b.type, label: String(b.label || "").slice(0, 500),
      required: Boolean(b.required), config: typeof b.config === "object" ? b.config : {},
      reason: String(b.reason || ""),
    }));

    res.json({ success: true, suggestions: clean, formTitle: form.title });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  7. APPLY SUGGESTION
//  POST /forms/:formId/ai/apply-suggestion
// ════════════════════════════════════════════════════════════════
export const applySuggestion = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertEditor(formId, userId);

    const { type, label, required, config } = req.body;
    if (!VALID_BLOCK_TYPES.includes(type)) throw new AppError("Invalid block type", 400);

    const lastBlock = await client.block.findFirst({ where: { formId }, orderBy: { order: "desc" }, select: { order: true } });
    const order = (lastBlock?.order ?? 0) + 1000;

    const block = await client.block.create({
      data: { formId, type, order, label: String(label || "").slice(0, 500), required: Boolean(required), config: typeof config === "object" ? config : {} },
    });

    res.status(201).json({ success: true, data: block });
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════
//  8. AUTO-TRANSLATE FORM
//  POST /forms/:formId/ai/translate
//  Body: { targetLanguage: string, applyToForm?: boolean }
// ════════════════════════════════════════════════════════════════
export const translateForm = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    const { targetLanguage, applyToForm } = req.body;
    if (!targetLanguage?.trim()) throw new AppError("targetLanguage is required", 400);
    await assertEditor(formId, userId);

    const form = await client.form.findUnique({
      where: { id: formId },
      include: { blocks: { orderBy: { order: "asc" } }, settings: true },
    });
    if (!form) throw new AppError("Form not found", 404);

    const translatableData = {
      title: form.title,
      description: form.description || "",
      thankYouMessage: form.settings?.thankYouMessage || "",
      submitButtonLabel: form.settings?.submitButtonLabel || "Submit",
      blocks: form.blocks.map(b => ({
        id: b.id, label: b.label || "",
        config: {
          placeholder: b.config?.placeholder || "",
          options: b.config?.options || [],
          minLabel: b.config?.minLabel || "",
          maxLabel: b.config?.maxLabel || "",
        },
      })),
    };

    const prompt = `You are a professional translator. Translate this form content to ${targetLanguage}.
Rules: translate only human-readable text (labels, placeholders, options, messages). Do NOT change IDs. Return ONLY valid JSON in the exact same structure.

Input:
${JSON.stringify(translatableData, null, 2)}`;

    const model = gemini();
    const result = await model.generateContent(prompt);
    const raw = stripFences(result.response.text());
    let translated;
    try { translated = JSON.parse(raw); }
    catch { throw new AppError("AI returned invalid translation. Please try again.", 500); }

    if (applyToForm) {
      await client.form.update({
        where: { id: formId },
        data: { title: translated.title || form.title, description: translated.description || form.description },
      });
      if (form.settings) {
        await client.formSettings.update({
          where: { formId },
          data: { thankYouMessage: translated.thankYouMessage || form.settings.thankYouMessage, submitButtonLabel: translated.submitButtonLabel || form.settings.submitButtonLabel },
        });
      }
      for (const tb of (translated.blocks || [])) {
        const original = form.blocks.find(b => b.id === tb.id);
        if (!original) continue;
        await client.block.update({
          where: { id: tb.id },
          data: {
            label: tb.label || original.label,
            config: { ...original.config, ...(tb.config?.placeholder && { placeholder: tb.config.placeholder }), ...(tb.config?.options?.length && { options: tb.config.options }), ...(tb.config?.minLabel && { minLabel: tb.config.minLabel }), ...(tb.config?.maxLabel && { maxLabel: tb.config.maxLabel }) },
          },
        });
      }
      const updatedForm = await client.form.findUnique({ where: { id: formId }, include: { blocks: { orderBy: { order: "asc" } }, settings: true } });
      return res.json({ success: true, applied: true, message: `Form translated to ${targetLanguage} and saved.`, data: updatedForm, translated });
    }

    res.json({ success: true, applied: false, targetLanguage, original: translatableData, translated });
  } catch (err) { next(err); }
};