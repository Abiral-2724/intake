// index.js — updated with form builder routes

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from "http";

// Existing routes
import userRouter from './routes/user.routes.js';
import featureRouter from './routes/featurerequest.routes.js';
import turnstileRouter from './routes/turnstile.routes.js';
import workspaceRouter from './routes/workspace.routes.js';  // already built by you
import client from "./prisma.js";
// New form builder routes
import formRouter from './routes/form.routes.js';
import blockRouter from './routes/block.routes.js';
import responseRouter from './routes/response.routes.js';
import aiRouter from "./routes/ai.routes.js";
import themeRouter from "./routes/theme.routes.js";
import integrationRouter from './routes/integration.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startDbKeepAlive } from "./utils/dbKeepAlive.js";

dotenv.config({});

const app = express();
const httpServer = createServer(app); 
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: process.env.APP_URL,
  credentials: true,
};
app.use(cors(corsOptions));

// ── Existing routes ──────────────────────────────────────────
app.use('/api/v1/auth', userRouter);
app.use('/api/v1/feature/request', featureRouter);
app.use('/api', turnstileRouter);
app.use('/api/v1', workspaceRouter);

// ── Form builder routes ──────────────────────────────────────
app.use('/api/v1', formRouter);      // /api/v1/workspaces/:id/forms, /api/v1/forms/:id
app.use('/api/v1', blockRouter);     // /api/v1/forms/:formId/blocks
app.use('/api/v1', responseRouter);  // /api/v1/forms/:slug/submit, /api/v1/forms/:formId/responses

app.use('/api/v1', themeRouter);

app.use('/api/v1', aiRouter);
app.use('/api/v1', integrationRouter);

// ── Global error handler (must be last) ─────────────────────
app.use(errorHandler);



app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/v1/health/db", async (req, res) => {
  try {
    await client.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "up", timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("[health/db] failed:", e.message);
    res.status(500).json({ status: "error", db: "down" });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
 
  startDbKeepAlive(); 

  if (process.env.NODE_ENV === "production") {
    const BACKEND_URL = process.env.API_URL; // add this to Render env vars
    if (BACKEND_URL) {
      setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/health/db`);
          console.log("[keep-alive] ping sent" ,res.status);
        } catch (e) {
          console.warn("[keep-alive] ping failed:", e.message);
        }
      }, 14 * 60 * 1000); // every 14 minutes
    }
  }
});