import { AppError } from "../middleware/errorHandler.js";
import client from "../prisma.js";
import crypto from "crypto";
import axios from "axios";

// UUID validation — catches malformed IDs before they hit Prisma
const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const API_URL = process.env.API_URL || "http://localhost:8000";

// ── Notion OAuth config ──────────────────────────────────────────
const NOTION_CLIENT_ID     = process.env.NOTION_CLIENT_ID;
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const NOTION_REDIRECT_URI  = `${API_URL}/api/v1/integrations/notion/callback`;

// ── Google OAuth config ──────────────────────────────────────────
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI  = `${API_URL}/api/v1/integrations/google/callback`;
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

// ── Helpers ──────────────────────────────────────────────────────

/** Verify form membership */
async function assertAccess(formId, userId) {
  const form = await client.form.findUnique({
    where: { id: formId },
    select: { workspaceId: true, title: true },
  });
  if (!form) throw new AppError("Form not found", 404);
  const member = await client.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: form.workspaceId, userId } },
  });
  if (!member || member.role === "VIEWER") throw new AppError("Access denied", 403);
  return form;
}

/**
 * The Integration model's formId references FormSettings.id (not Form.id).
 * This helper gets-or-creates the FormSettings record and returns its id.
 */
async function getOrCreateSettingsId(formId) {
  let settings = await client.formSettings.findUnique({
    where: { formId },
    select: { id: true },
  });
  if (!settings) {
    settings = await client.formSettings.create({
      data: { formId },
      select: { id: true },
    });
  }
  return settings.id;
}

/** Refresh a Google access token using the refresh token */
async function refreshGoogleToken(integration) {
  if (!integration.refreshToken) throw new Error("No refresh token");
  const res = await axios.post("https://oauth2.googleapis.com/token", {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: integration.refreshToken,
    grant_type: "refresh_token",
  });
  const expiry = new Date(Date.now() + res.data.expires_in * 1000);
  await client.integration.update({
    where: { id: integration.id },
    data: { accessToken: res.data.access_token, tokenExpiry: expiry },
  });
  return res.data.access_token;
}

/** Get a valid Google access token, refreshing if needed */
async function getGoogleToken(integration) {
  if (integration.tokenExpiry && new Date() > new Date(integration.tokenExpiry - 60000)) {
    return refreshGoogleToken(integration);
  }
  return integration.accessToken;
}

// ─────────────────────────────────────────────────────────────────
//  LIST integrations for a form
// ─────────────────────────────────────────────────────────────────
export const getIntegrations = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertAccess(formId, userId);

    const settingsId = await getOrCreateSettingsId(formId);

    const integrations = await client.integration.findMany({
      where: { formId: settingsId },
      select: {
        id: true, type: true, status: true, config: true,
        lastSyncAt: true, lastError: true, createdAt: true,
      },
    });
    res.json({ success: true, data: integrations });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  DISCONNECT an integration
// ─────────────────────────────────────────────────────────────────
export const disconnectIntegration = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId, type } = req.params;
    await assertAccess(formId, userId);
    const settingsId = await getOrCreateSettingsId(formId);
    await client.integration.deleteMany({ where: { formId: settingsId, type } });
    res.json({ success: true, message: `${type} integration disconnected` });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  NOTION OAuth  ─ Step 1: redirect user to Notion
// ─────────────────────────────────────────────────────────────────
export const notionOAuthStart = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertAccess(formId, userId);

    // Store CSRF state
    const state = crypto.randomBytes(24).toString("hex");
    // Store the real Form.id in state — we'll resolve settingsId in the callback
    await client.oAuthState.create({ data: { state, userId, formId, type: "notion" } });

    const url = new URL("https://api.notion.com/v1/oauth/authorize");
    url.searchParams.set("client_id", NOTION_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("owner", "user");
    url.searchParams.set("redirect_uri", NOTION_REDIRECT_URI);
    url.searchParams.set("state", state);

    res.json({ success: true, url: url.toString() });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  NOTION OAuth  ─ Step 2: callback, exchange code for token
// ─────────────────────────────────────────────────────────────────
export const notionOAuthCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${APP_URL}/integrations/error?reason=${encodeURIComponent(error)}`);
    }

    // Validate CSRF state
    const stateRecord = await client.oAuthState.findUnique({ where: { state } });
    if (!stateRecord) {
      return res.redirect(`${APP_URL}/integrations/error?reason=invalid_state`);
    }
    await client.oAuthState.delete({ where: { state } });

    const { formId, userId } = stateRecord;

    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: NOTION_REDIRECT_URI,
      },
      {
        auth: { username: NOTION_CLIENT_ID, password: NOTION_CLIENT_SECRET },
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access_token, workspace_id, workspace_name, bot_id } = tokenRes.data;

    // Fetch the user's Notion databases to let them pick one
    const dbRes = await axios.post(
      "https://api.notion.com/v1/search",
      { filter: { value: "database", property: "object" }, page_size: 20 },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    const databases = dbRes.data.results.map((db) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled database",
      url: db.url,
    }));

    // Validate formId is a proper UUID before touching Prisma
    if (!isValidUUID(formId)) {
      console.error("[notion callback] Invalid formId UUID:", formId);
      return res.redirect(`${APP_URL}/integrations/error?reason=invalid_form_id`);
    }

    // Verify the form actually exists in DB
    const formExists = await client.form.findUnique({ where: { id: formId }, select: { id: true } });
    if (!formExists) {
      console.error("[notion callback] Form not found in DB:", formId);
      return res.redirect(`${APP_URL}/integrations/error?reason=form_not_found`);
    }

    // Integration.formId references FormSettings.id — resolve it here
    const settingsId = await getOrCreateSettingsId(formId);
    console.log("[notion callback] formId:", formId, "-> settingsId:", settingsId);

    // Store token temporarily with "pending_config" status
    await client.integration.upsert({
      where: { formId_type: { formId: settingsId, type: "notion" } },
      update: {
        accessToken: access_token,
        refreshToken: null,
        status: "pending_config",
        config: { workspaceId: workspace_id, workspaceName: workspace_name, databases },
        lastError: null,
      },
      create: {
        formId: settingsId,
        type: "notion",
        accessToken: access_token,
        status: "pending_config",
        config: { workspaceId: workspace_id, workspaceName: workspace_name, databases },
      },
    });

    // Redirect to frontend to let user pick a database
    res.redirect(`${APP_URL}/integrations/notion/setup?formId=${formId}`);
  } catch (err) {
    console.error("[notion callback] Full error:", {
      message: err.message,
      response: err.response?.data,
      stack: err.stack?.split("\n")[1],
    });
    res.redirect(`${APP_URL}/integrations/error?reason=token_exchange_failed`);
  }
};

// ─────────────────────────────────────────────────────────────────
//  NOTION  ─ Step 3: user picks a database, we finalise config
// ─────────────────────────────────────────────────────────────────
export const notionSetupDatabase = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    const { databaseId, databaseTitle } = req.body;

    const settingsId = await getOrCreateSettingsId(formId);
    const integration = await client.integration.findUnique({
      where: { formId_type: { formId: settingsId, type: "notion" } },
    });
    if (!integration) throw new AppError("Notion not connected yet", 400);

    // Fetch the form's question blocks to build column mapping
    const form = await client.form.findUnique({
      where: { id: formId },
      include: { blocks: { orderBy: { order: "asc" }, where: { type: { notIn: ["HEADING_1","HEADING_2","TEXT","DIVIDER","IMAGE"] } } } },
    });

    // Auto-create Notion database properties from form blocks
    const token = integration.accessToken;
    const properties = {
      "Submitted At": { date: {} },
      "Response #": { number: { format: "number" } },
    };
    for (const block of form.blocks) {
      const label = block.label || block.type;
      if (["EMAIL"].includes(block.type)) properties[label] = { email: {} };
      else if (["PHONE_NUMBER"].includes(block.type)) properties[label] = { phone_number: {} };
      else if (["NUMBER","RATING","LINEAR_SCALE"].includes(block.type)) properties[label] = { number: { format: "number" } };
      else if (["DATE","TIME"].includes(block.type)) properties[label] = { rich_text: {} };
      else if (["MULTIPLE_CHOICE","DROPDOWN"].includes(block.type)) properties[label] = { select: { options: (block.config?.options || []).map(o=>({name:o})) } };
      else if (["CHECKBOXES"].includes(block.type)) properties[label] = { multi_select: { options: (block.config?.options || []).map(o=>({name:o})) } };
      else if (["LINK"].includes(block.type)) properties[label] = { url: {} };
      else properties[label] = { rich_text: {} };
    }
    // First property becomes the title
    const [firstLabel] = Object.keys(properties).filter(k => k !== "Submitted At" && k !== "Response #");

    // Try to update the database schema (user's chosen DB)
    try {
      await axios.patch(
        `https://api.notion.com/v1/databases/${databaseId}`,
        { properties },
        { headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" } }
      );
    } catch (e) {
      // If the DB is new/empty this is fine; log and continue
      console.warn("[notion] Could not update DB schema:", e.response?.data?.message);
    }

    const updatedIntegration = await client.integration.update({
      where: { formId_type: { formId: settingsId, type: "notion" } },
      data: {
        status: "active",
        config: {
          ...(integration.config || {}),
          databaseId,
          databaseTitle,
          autoCreatedProperties: true,
        },
      },
    });

    // Bulk sync all existing responses in the background
    bulkSyncExistingResponses(formId, updatedIntegration)
      .then(({ synced, failed }) => {
        console.log(`[notion setup] Initial bulk sync complete: ${synced} synced, ${failed} failed`);
      })
      .catch(err => console.error("[notion setup] Bulk sync error:", err.message));

    res.json({
      success: true,
      message: "Notion integration active",
      note: "Existing responses are being synced in the background.",
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  GOOGLE SHEETS OAuth  ─ Step 1: redirect user to Google
// ─────────────────────────────────────────────────────────────────
export const googleOAuthStart = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertAccess(formId, userId);

    const state = crypto.randomBytes(24).toString("hex");
    await client.oAuthState.create({ data: { state, userId, formId, type: "google_sheets" } }); // stores real Form.id

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", GOOGLE_SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    res.json({ success: true, url: url.toString() });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────
//  GOOGLE SHEETS OAuth  ─ Step 2: callback
// ─────────────────────────────────────────────────────────────────
export const googleOAuthCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(`${APP_URL}/integrations/error?reason=${encodeURIComponent(error)}`);

    const stateRecord = await client.oAuthState.findUnique({ where: { state } });
    if (!stateRecord) return res.redirect(`${APP_URL}/integrations/error?reason=invalid_state`);
    await client.oAuthState.delete({ where: { state } });

    const { formId, userId } = stateRecord;

    // Validate formId first
    if (!isValidUUID(formId)) {
      console.error("[google callback] Invalid formId UUID:", formId);
      return res.redirect(`${APP_URL}/integrations/error?reason=invalid_form_id`);
    }

    // Exchange code for tokens
    // IMPORTANT: Google requires application/x-www-form-urlencoded, not JSON
    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", GOOGLE_CLIENT_ID);
    params.append("client_secret", GOOGLE_CLIENT_SECRET);
    params.append("redirect_uri", GOOGLE_REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    let tokenData;
    try {
      const tokenRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      tokenData = tokenRes.data;
      console.log("[google callback] Token exchange success, has access_token:", !!tokenData.access_token);
    } catch (tokenErr) {
      console.error("[google callback] Token exchange failed:", tokenErr.response?.data || tokenErr.message);
      return res.redirect(`${APP_URL}/integrations/error?reason=token_exchange_failed`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    if (!access_token) {
      console.error("[google callback] No access_token in response:", tokenData);
      return res.redirect(`${APP_URL}/integrations/error?reason=token_exchange_failed`);
    }

    const tokenExpiry = new Date(Date.now() + (expires_in || 3600) * 1000);

    // Get user email — skip if it fails, not critical
    let googleEmail = "unknown";
    try {
      const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      googleEmail = userRes.data.email || "unknown";
    } catch (e) {
      console.warn("[google callback] Could not fetch user info:", e.message);
    }

    // Verify the form exists in DB
    const formExists = await client.form.findUnique({ where: { id: formId }, select: { id: true } });
    if (!formExists) {
      console.error("[google callback] Form not found in DB:", formId);
      return res.redirect(`${APP_URL}/integrations/error?reason=form_not_found`);
    }

    // Integration.formId references FormSettings.id — resolve it here
    const settingsId = await getOrCreateSettingsId(formId);
    console.log("[google callback] formId:", formId, "-> settingsId:", settingsId);

    // Store tokens
    await client.integration.upsert({
      where: { formId_type: { formId: settingsId, type: "google_sheets" } },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        tokenExpiry,
        status: "pending_config",
        config: { googleEmail },
        lastError: null,
      },
      create: {
        formId: settingsId,
        type: "google_sheets",
        accessToken: access_token,
        refreshToken: refresh_token || null,
        tokenExpiry,
        status: "pending_config",
        config: { googleEmail },
      },
    });

    console.log("[google callback] ✅ Tokens saved, redirecting to setup");
    res.redirect(`${APP_URL}/integrations/google/setup?formId=${formId}`);
  } catch (err) {
    console.error("[google callback] Unexpected error:", err.response?.data || err.message);
    res.redirect(`${APP_URL}/integrations/error?reason=token_exchange_failed`);
  }
};

// ─────────────────────────────────────────────────────────────────
//  GOOGLE SHEETS  ─ Step 3: auto-create spreadsheet and finalise
// ─────────────────────────────────────────────────────────────────
export const googleSetupSheet = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;

    const settingsId = await getOrCreateSettingsId(formId);
    const integration = await client.integration.findUnique({
      where: { formId_type: { formId: settingsId, type: "google_sheets" } },
    });
    if (!integration) throw new AppError("Google not connected yet", 400);

    const form = await client.form.findUnique({
      where: { id: formId },
      include: {
        blocks: {
          orderBy: { order: "asc" },
          where: { type: { notIn: ["HEADING_1","HEADING_2","TEXT","DIVIDER","IMAGE"] } },
        },
      },
    });

    const token = await getGoogleToken(integration);

    // Build header row
    const headers = [
      "Response #", "Submitted At", "Status",
      ...form.blocks.map((b) => b.label || b.type),
    ];

    // Create a new Google Spreadsheet
    const createRes = await axios.post(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        properties: { title: `${form.title} — Responses (Intake)` },
        sheets: [{
          properties: { title: "Responses", sheetId: 0, index: 0 },
          data: [{ rowData: [{ values: headers.map(h => ({ userEnteredValue: { stringValue: h } })) }] }],
        }],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const spreadsheetId = createRes.data.spreadsheetId;
    const spreadsheetUrl = createRes.data.spreadsheetUrl;

    // Bold header row
    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.24, green: 0.36, blue: 0.87 } } },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        }],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updatedGoogleIntegration = await client.integration.update({
      where: { formId_type: { formId: settingsId, type: "google_sheets" } },
      data: {
        status: "active",
        config: {
          ...(integration.config || {}),
          spreadsheetId,
          spreadsheetUrl,
          sheetName: "Responses",
          headers,
          formBlockIds: form.blocks.map(b => b.id),
        },
      },
    });

    // Bulk sync all existing responses in the background
    bulkSyncExistingResponses(formId, updatedGoogleIntegration)
      .then(({ synced, failed }) => {
        console.log(`[google setup] Initial bulk sync complete: ${synced} synced, ${failed} failed`);
      })
      .catch(err => console.error("[google setup] Bulk sync error:", err.message));

    res.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      note: "Existing responses are being synced in the background.",
    });
  } catch (err) {
    console.error("[google setup]", err.response?.data || err.message);
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
//  BULK SYNC — push all existing responses on first connect
// ─────────────────────────────────────────────────────────────────
async function bulkSyncExistingResponses(formId, integration) {
  // Fetch ALL existing responses with their answers + block info
  const responses = await client.response.findMany({
    where: { formId },
    include: {
      answers: {
        include: {
          block: { select: { id: true, type: true, label: true, order: true } },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  if (responses.length === 0) {
    console.log(`[bulk sync] No existing responses to sync for form ${formId}`);
    return { synced: 0, failed: 0 };
  }

  console.log(`[bulk sync] Syncing ${responses.length} existing responses to ${integration.type}...`);

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    try {
      const responseData = {
        answers: r.answers,
        submittedAt: r.submittedAt.toISOString(),
        index: i + 1,
        isComplete: r.isComplete,
      };

      if (integration.type === "notion") {
        await pushToNotion(integration, responseData);
      } else if (integration.type === "google_sheets") {
        await pushToGoogleSheets(integration, responseData);
      }

      synced++;
      // Small delay to avoid rate limiting (Notion: 3 req/s, Sheets: 60 req/min)
      await new Promise(resolve => setTimeout(resolve, 350));
    } catch (err) {
      console.error(`[bulk sync] Failed response ${i + 1}:`, err.message);
      failed++;
    }
  }

  console.log(`[bulk sync] ✅ Done — ${synced} synced, ${failed} failed`);

  // Update lastSyncAt
  await client.integration.update({
    where: { id: integration.id },
    data: {
      lastSyncAt: new Date(),
      lastError: failed > 0 ? `${failed} responses failed during initial sync` : null,
      status: "active",
    },
  });

  return { synced, failed };
}

// ─────────────────────────────────────────────────────────────────
//  PUSH a response to all active integrations (called after submit)
// ─────────────────────────────────────────────────────────────────
export const pushResponseToIntegrations = async (formId, responseData) => {
  // Resolve FormSettings.id from Form.id
  const settings = await client.formSettings.findUnique({
    where: { formId },
    select: { id: true },
  });
  if (!settings) return; // No settings = no integrations possible

  const integrations = await client.integration.findMany({
    where: { formId: settings.id, status: "active" },
  });

  for (const integration of integrations) {
    try {
      if (integration.type === "notion") {
        await pushToNotion(integration, responseData);
      } else if (integration.type === "google_sheets") {
        await pushToGoogleSheets(integration, responseData);
      }
      await client.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), lastError: null, status: "active" },
      });
    } catch (err) {
      console.error(`[integration push] ${integration.type}:`, err.message);
      await client.integration.update({
        where: { id: integration.id },
        data: { lastError: err.message, status: "error" },
      });
    }
  }
};

// ── Push to Notion ───────────────────────────────────────────────
async function pushToNotion(integration, responseData) {
  const { databaseId } = integration.config;
  if (!databaseId) throw new Error("No Notion database configured");

  const token = integration.accessToken;
  const { answers, submittedAt, index } = responseData;
  const NOTION_HEADERS = { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" };

  // ── Step 1: fetch the real database schema ──────────────────
  // This tells us exactly which properties exist and their types.
  let dbSchema;
  try {
    const dbRes = await axios.get(
      `https://api.notion.com/v1/databases/${databaseId}`,
      { headers: NOTION_HEADERS }
    );
    dbSchema = dbRes.data.properties; // { "Name": { type: "title", ... }, ... }
  } catch (e) {
    throw new Error(`Cannot read Notion database schema: ${e.response?.data?.message || e.message}`);
  }

  console.log("[notion push] DB properties:", Object.keys(dbSchema));

  // ── Step 2: find the title property name ───────────────────
  const titlePropName = Object.keys(dbSchema).find(k => dbSchema[k].type === "title") || "Name";

  // ── Step 3: add any missing columns to the database ────────
  // Build desired properties from form answers
  const desiredProps = {
    "Submitted At": { date: {} },
    "Response #": { number: { format: "number" } },
    "Status": { select: { options: [{ name: "Complete" }, { name: "Partial" }] } },
  };
  for (const answer of answers) {
    const label = answer.block.label || answer.block.type;
    if (label === titlePropName) continue; // skip — title already exists
    const type = answer.block.type;
    if (type === "EMAIL") desiredProps[label] = { email: {} };
    else if (type === "PHONE_NUMBER") desiredProps[label] = { phone_number: {} };
    else if (["NUMBER","RATING","LINEAR_SCALE"].includes(type)) desiredProps[label] = { number: { format: "number" } };
    else if (type === "MULTIPLE_CHOICE" || type === "DROPDOWN") desiredProps[label] = { select: {} };
    else if (type === "CHECKBOXES") desiredProps[label] = { multi_select: {} };
    else if (type === "LINK") desiredProps[label] = { url: {} };
    else desiredProps[label] = { rich_text: {} };
  }

  // Only add props that don't already exist in the DB
  const missingProps = {};
  for (const [name, def] of Object.entries(desiredProps)) {
    if (!dbSchema[name]) missingProps[name] = def;
  }
  if (Object.keys(missingProps).length > 0) {
    console.log("[notion push] Adding missing properties:", Object.keys(missingProps));
    try {
      const patchRes = await axios.patch(
        `https://api.notion.com/v1/databases/${databaseId}`,
        { properties: missingProps },
        { headers: NOTION_HEADERS }
      );
      // Update local schema map
      Object.assign(dbSchema, patchRes.data.properties);
    } catch (e) {
      console.warn("[notion push] Could not add properties:", e.response?.data?.message);
      // Continue anyway — we'll push whatever properties do exist
    }
  }

  // ── Step 4: build the page properties payload ──────────────
  const properties = {};

  // Always set the title property
  properties[titlePropName] = {
    title: [{ text: { content: `Response #${index}` } }]
  };

  // Add Submitted At if the property exists
  if (dbSchema["Submitted At"]) {
    properties["Submitted At"] = { date: { start: new Date(submittedAt).toISOString() } };
  }
  // Add Response # if the property exists
  if (dbSchema["Response #"]) {
    properties["Response #"] = { number: index };
  }
  // Add Status if property exists
  if (dbSchema["Status"]) {
    properties["Status"] = { select: { name: responseData.isComplete ? "Complete" : "Partial" } };
  }

  // Map each answer to the correct Notion property type
  for (const answer of answers) {
    const label = answer.block.label || answer.block.type;
    if (label === titlePropName) continue;

    const val = answer.value;
    if (val === null || val === undefined || val === "") continue;

    const schemaProp = dbSchema[label];
    if (!schemaProp) {
      console.warn(`[notion push] Property "${label}" not found in DB, skipping`);
      continue;
    }

    const propType = schemaProp.type;

    try {
      if (propType === "title") {
        properties[label] = { title: [{ text: { content: String(val).slice(0, 2000) } }] };
      } else if (propType === "rich_text") {
        const text = Array.isArray(val) ? val.join(", ") : String(val);
        properties[label] = { rich_text: [{ text: { content: text.slice(0, 2000) } }] };
      } else if (propType === "email") {
        properties[label] = { email: String(val) };
      } else if (propType === "phone_number") {
        properties[label] = { phone_number: String(val) };
      } else if (propType === "number") {
        const num = Number(val);
        if (!isNaN(num)) properties[label] = { number: num };
      } else if (propType === "select") {
        // Notion select options cannot contain commas — replace with " /"
        const selectVal = String(val).replace(/,/g, " /").trim().slice(0, 100);
        properties[label] = { select: { name: selectVal } };
      } else if (propType === "multi_select") {
        // Notion bans commas inside individual multi_select option names.
        // Strategy:
        //   - If val is an array  → each element is one option, sanitize commas out
        //   - If val is a string  → treat the WHOLE string as one option (do NOT split
        //     on commas because the answer itself may contain commas naturally e.g.
        //     "Yes, my guest will also be attending.")
        //     Just remove the commas from the option name before sending.
        let opts;
        if (Array.isArray(val)) {
          opts = val.map(o => String(o).replace(/,/g, " /").trim()).filter(Boolean);
        } else {
          // Single string answer — keep as one option, strip commas
          const cleaned = String(val).replace(/,/g, " /").trim().slice(0, 100);
          opts = cleaned ? [cleaned] : [];
        }
        properties[label] = {
          multi_select: opts.map(o => ({ name: o.slice(0, 100) })),
        };
      } else if (propType === "url") {
        properties[label] = { url: String(val) };
      } else if (propType === "date") {
        properties[label] = { date: { start: String(val) } };
      } else if (propType === "checkbox") {
        properties[label] = { checkbox: Boolean(val) };
      } else {
        // Fallback: store as rich_text
        const text = Array.isArray(val) ? val.join(", ") : String(val);
        properties[label] = { rich_text: [{ text: { content: text.slice(0, 2000) } }] };
      }
    } catch (mapErr) {
      console.warn(`[notion push] Failed to map property "${label}":`, mapErr.message);
    }
  }

  console.log("[notion push] Sending properties:", Object.keys(properties));

  // ── Step 5: create the page ─────────────────────────────────
  try {
    await axios.post(
      "https://api.notion.com/v1/pages",
      { parent: { database_id: databaseId }, properties },
      { headers: NOTION_HEADERS }
    );
    console.log("[notion push] ✅ Page created successfully for response #", index);
  } catch (e) {
    const errDetail = e.response?.data;
    console.error("[notion push] ❌ Failed to create page:", JSON.stringify(errDetail, null, 2));
    throw new Error(`Notion page creation failed: ${errDetail?.message || e.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────
//  TEST PUSH — manually push a test row to all active integrations
//  POST /api/v1/forms/:formId/integrations/test-push
//  Remove this in production!
// ─────────────────────────────────────────────────────────────────
export const testPush = async (req, res, next) => {
  const log = [];
  const addLog = (msg, data) => {
    const entry = { msg, ...(data ? { data } : {}) };
    console.log("[test-push]", msg, data || "");
    log.push(entry);
  };

  try {
    const userId = req.headers["x-user-id"];
    if (!userId) throw new AppError("Unauthorized", 401);
    const { formId } = req.params;
    await assertAccess(formId, userId);
    addLog("Form access verified", { formId });

    // 1. Get FormSettings
    const settings = await client.formSettings.findUnique({ where: { formId }, select: { id: true } });
    addLog("FormSettings lookup", { settingsId: settings?.id || "NOT FOUND" });
    if (!settings) return res.json({ success: false, log, error: "No FormSettings found for this form" });

    // 2. Get integrations
    const integrations = await client.integration.findMany({
      where: { formId: settings.id },
    });
    addLog("Integrations found", integrations.map(i => ({ id: i.id, type: i.type, status: i.status, config: i.config })));

    if (integrations.length === 0) {
      return res.json({ success: false, log, error: "No integrations found. Is Notion connected?" });
    }

    const notionInt = integrations.find(i => i.type === "notion");
    if (!notionInt) {
      return res.json({ success: false, log, error: "No Notion integration found", integrations: integrations.map(i=>i.type) });
    }

    addLog("Notion integration", { status: notionInt.status, config: notionInt.config, hasToken: !!notionInt.accessToken });

    const { databaseId } = notionInt.config || {};
    if (!databaseId) {
      return res.json({ success: false, log, error: "No databaseId in config. Setup not completed." });
    }

    const NOTION_HEADERS = {
      Authorization: `Bearer ${notionInt.accessToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // 3. Test: read the database
    addLog("Fetching Notion database schema...");
    let dbData;
    try {
      const dbRes = await axios.get(`https://api.notion.com/v1/databases/${databaseId}`, { headers: NOTION_HEADERS });
      dbData = dbRes.data;
      addLog("Database schema fetched", {
        title: dbData.title?.[0]?.plain_text,
        properties: Object.fromEntries(Object.entries(dbData.properties).map(([k,v]) => [k, v.type])),
      });
    } catch (e) {
      addLog("FAILED to fetch database", { status: e.response?.status, error: e.response?.data });
      return res.json({ success: false, log, error: "Cannot read Notion database — token may be expired or database not shared with integration" });
    }

    // 4. Find title property
    const titlePropName = Object.keys(dbData.properties).find(k => dbData.properties[k].type === "title") || "Name";
    addLog("Title property name", { titlePropName });

    // 5. Add missing properties
    const needProps = {
      "Submitted At": { date: {} },
      "Response #": { number: { format: "number" } },
      "Test Field": { rich_text: {} },
    };
    const missing = Object.fromEntries(Object.entries(needProps).filter(([k]) => !dbData.properties[k]));
    if (Object.keys(missing).length > 0) {
      addLog("Adding missing properties to DB", Object.keys(missing));
      try {
        await axios.patch(`https://api.notion.com/v1/databases/${databaseId}`, { properties: missing }, { headers: NOTION_HEADERS });
        addLog("Properties added successfully");
      } catch (e) {
        addLog("WARNING: Could not add properties", { error: e.response?.data });
      }
    }

    // 6. Create a test page
    const pagePayload = {
      parent: { database_id: databaseId },
      properties: {
        [titlePropName]: { title: [{ text: { content: "🧪 Test from Intake — " + new Date().toLocaleTimeString() } }] },
        "Submitted At": { date: { start: new Date().toISOString() } },
        "Response #": { number: 9999 },
        "Test Field": { rich_text: [{ text: { content: "Integration is working!" } }] },
      },
    };
    addLog("Creating test page with payload", pagePayload);

    try {
      const pageRes = await axios.post("https://api.notion.com/v1/pages", pagePayload, { headers: NOTION_HEADERS });
      addLog("✅ Page created!", { pageId: pageRes.data.id, url: pageRes.data.url });
      return res.json({ success: true, log, pageUrl: pageRes.data.url, message: "Check your Notion database — a test row was just added!" });
    } catch (e) {
      addLog("❌ FAILED to create page", { status: e.response?.status, error: e.response?.data });
      return res.json({ success: false, log, error: e.response?.data });
    }

  } catch (err) {
    console.error("[test push error]", err);
    res.json({ success: false, log, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
//  DEBUG — verify a state token and the form it references
//  GET /api/v1/integrations/debug-state?state=xxx
//  Remove this in production!
// ─────────────────────────────────────────────────────────────────
export const debugState = async (req, res, next) => {
  try {
    const { state } = req.query;
    if (!state) return res.json({ error: "No state provided" });

    const record = await client.oAuthState.findUnique({ where: { state } });
    if (!record) return res.json({ error: "State not found (already used or expired)" });

    const form = await client.form.findUnique({
      where: { id: record.formId },
      select: { id: true, title: true },
    });

    res.json({
      state: record,
      formIdIsValidUUID: isValidUUID(record.formId),
      formFoundInDB: !!form,
      form: form || null,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
};

// ── Push to Google Sheets ────────────────────────────────────────
async function pushToGoogleSheets(integration, responseData) {
  const { spreadsheetId, sheetName, headers, formBlockIds } = integration.config;
  if (!spreadsheetId) throw new Error("No spreadsheet configured");

  const token = await getGoogleToken(integration);
  const { answers, submittedAt, index, isComplete } = responseData;

  // Build row in same order as headers
  const answerMap = {};
  for (const a of answers) {
    const label = a.block.label || a.block.type;
    answerMap[label] = Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "");
  }

  const row = headers.map(h => {
    if (h === "Response #") return index;
    if (h === "Submitted At") return new Date(submittedAt).toLocaleString();
    if (h === "Status") return isComplete ? "Complete" : "Partial";
    return answerMap[h] ?? "";
  });

  await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`,
    { values: [row] },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}