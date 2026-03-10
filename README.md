# Intake — AI-Powered Form Builder

> Build beautiful forms in seconds. Collect unlimited responses for free. Understand your data with Gemini AI.

**Live:** [intake-plum.vercel.app](https://intake-plum.vercel.app) 

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [AI Features](#ai-features)
- [Integrations](#integrations)
- [Deployment](#deployment)
- [Known Issues & Notes](#known-issues--notes)

---

## Overview

Intake is a full-stack form builder inspired by Tally.so, built from scratch with a Node.js/Express backend and a Next.js 14 App Router frontend. It combines a Notion-style block editor with five Gemini AI features, real-time analytics, multi-page form support, and native integrations with Notion and Google Sheets.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (service role for admin ops) |
| AI | Google Gemini (`gemini-2.5-flash-lite`) via `@google/generative-ai` |
| File uploads | Cloudinary |
| ID generation | `nanoid` |
| Password hashing | `bcrypt` |
| HTTP client | `axios` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component library | shadcn/ui |
| Auth client | Supabase JS (`@supabase/supabase-js`) |
| HTTP client | axios |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Animations | Framer Motion |
| Markdown | react-markdown |
| Bot protection | Cloudflare Turnstile |

---

## Features

### Form Builder
- **Block editor** — Notion-style block-by-block form building
- **16+ question types**: Short text, Long text, Multiple choice, Checkboxes, Dropdown, Number, Email, Phone, Link/URL, Date, Time, Rating (stars), Linear scale, File upload, Heading 1 & 2, Divider, Image
- **Multi-page forms** — Add `NEW_PAGE` block to split forms into pages with per-page validation, progress bar, and back/next navigation
- **Themes** — Customise colours, fonts, and background per form
- **Form settings** — Password protection, custom submit messages, redirect URLs, close dates
- **Conditional logic** — Show/hide blocks based on previous answers
- **Public form renderer** — Shareable via `/f/[slug]` with full multi-page support

### AI Features (powered by Gemini)
| Feature | Description | Endpoint |
|---|---|---|
| **AI Form Generator** | Describe a form in plain English → Gemini generates all blocks instantly | `POST /forms/:id/ai-generate` |
| **Full Form Generator** | Generate a complete multi-section form from a single prompt | `POST /forms/:id/ai-generate-full` |
| **AI Assistant** | Chat interface — ask anything about your form or responses | `POST /ai/chat` |
| **Response Analyser** | Analyse all responses with sentiment, themes, and summaries | `POST /forms/:id/ai/analyse` |
| **Smart Insights** | Ask questions about your data in plain English | `POST /forms/:id/ai/insights` |
| **Block Suggestions** | AI recommends missing/relevant questions for your form | `POST /forms/:id/ai/suggest-blocks` |
| **Auto-Translate** | Translate entire form to any language with preview before applying | `POST /forms/:id/ai/translate` |

All AI endpoints use `generateWithRetry()` with automatic retry on Gemini 429 rate-limit errors.

### Analytics Dashboard
- Submission volume bar chart (Recharts)
- Cumulative growth line chart
- Per-question response breakdowns
- Completion rate, total responses, average time stats

### Integrations
| Integration | Type | What it does |
|---|---|---|
| **Notion** | OAuth 2.0 | Auto-creates a Notion database from form questions; syncs every new response as a page |
| **Google Sheets** | OAuth 2.0 | Auto-creates a formatted spreadsheet with bold header row; appends every response as a row |

Both integrations:
- Bulk-sync all existing responses on first connect
- Push new responses in real time on form submission
- Auto-refresh expired OAuth tokens
- Show status (`active` / `error` / `pending_config`) and last sync time in the UI

### Workspace & Collaboration
- Multi-workspace support
- Workspace members with roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`)
- Invite members by email
- Workspace-scoped form management

### Auth
- Email/password sign up & log in
- Magic link (OTP) sign in with 90-second resend timer
- Google OAuth
- GitHub OAuth
- Cloudflare Turnstile bot protection on all auth forms
- Password reset flow

### Responses
- Real-time response collection
- Partial response saving
- Export responses
- Clear all responses
- Per-response detail view
- AI Insights and Analytics accessible from the responses toolbar

### Pages & Navigation
- `/` — Marketing landing page with hero, product video, integrations, AI features, testimonials, FAQ, footer
- `/dashboard` — Personalised workspace hub with stats, feature cards, empty state CTA
- `/auth` — Login / Register / Forgot password / OTP views
- `/workspaces/[id]` — Forms list for a workspace
- `/forms/[id]/editor` — Block editor with Build / Settings / Logic / Themes tabs
- `/forms/[id]/responses` — Response viewer
- `/forms/[id]/analytics` — Charts and stats
- `/forms/[id]/ai-insights` — Smart Insights + Ask Anything
- `/forms/[id]/translate` — 3-step translation flow
- `/integrations/notion/setup` — Notion database picker
- `/integrations/google/setup` — Google Sheets auto-setup
- `/templates` — Template gallery
- `/roadmap` — 24-item product roadmap with status filters
- `/help` — Search + accordion FAQ (29 articles, 6 categories)
- `/support` — Contact form
- `/privacy` — Privacy policy (10 sections)
- `/terms` — Terms of service (14 sections)
- `/whats-new` — Changelog

---

## Project Structure

```
intake/
├── backend/
│   ├── controllers/
│   │   ├── ai.controller.js          # All 8 AI endpoints
│   │   ├── block.controller.js       # Block CRUD
│   │   ├── form.controller.js        # Form CRUD + slug
│   │   ├── integration.controller.js # Notion + Google Sheets OAuth & sync
│   │   ├── response.controller.js    # Submit, list, export
│   │   ├── theme.controller.js       # Form theme management
│   │   ├── turnstile.controller.js   # Cloudflare Turnstile verification
│   │   └── user.controller.js        # Profile, avatar upload, account delete
│   ├── middleware/
│   │   └── errorHandler.js           # Global error handler → clean JSON
│   ├── routes/
│   │   ├── ai.routes.js
│   │   ├── block.routes.js
│   │   ├── form.routes.js
│   │   ├── integration.routes.js
│   │   ├── response.routes.js
│   │   ├── theme.routes.js
│   │   └── workspace.routes.js
│   ├── prisma.js                     # Prisma client singleton
│   └── index.js                     # Express app + route mounting
│
└── frontend/
    ├── app/
    │   ├── page.tsx                  # Marketing landing page
    │   ├── auth/page.tsx             # Auth flows + Turnstile
    │   ├── dashboard/page.tsx        # Workspace dashboard
    │   ├── workspaces/[id]/page.tsx
    │   ├── forms/[formId]/
    │   │   ├── editor/page.tsx       # Block editor
    │   │   ├── responses/page.tsx
    │   │   ├── analytics/page.tsx
    │   │   ├── ai-insights/page.tsx
    │   │   └── translate/page.tsx
    │   ├── f/[slug]/page.tsx         # Public form renderer
    │   ├── integrations/
    │   │   ├── notion/setup/page.tsx
    │   │   └── google/setup/page.tsx
    │   ├── templates/page.tsx
    │   ├── roadmap/page.tsx
    │   ├── help/page.tsx
    │   ├── support/page.tsx
    │   ├── privacy/page.tsx
    │   ├── terms/page.tsx
    │   └── whats-new/page.tsx
    └── components/
        ├── Navbar.tsx                # Glass morphism nav + profile dropdown
        ├── Sidebar.tsx               # Workspace sidebar with AI Assistant button
        ├── AIAssistant.tsx           # Chat panel powered by Gemini
        ├── AIBlockSuggestions.tsx    # Collapsible suggestion panel in editor
        ├── IntegrationIcon.tsx       # Client component for integration logos
        ├── testimonials.tsx          # Auto-rotating testimonials
        ├── FAQSection.tsx            # Animated accordion FAQ
        ├── Footer.tsx
        ├── ScaleHero.tsx             # Animated stats + bar chart section
        └── GlobalProviders.tsx
```

---

## Database Schema

### Core Models

```prisma
model User          { id, email, name, avatarUrl, ... }
model Workspace     { id, name, slug, logoUrl, members[], forms[] }
model WorkspaceMember { workspaceId, userId, role }
model Form          { id, title, slug, workspaceId, blocks[], responses[], settings }
model Block         { id, formId, type, label, order, required, config, logic }
model FormSettings  { id, formId, passwordProtected, closeDate, integrations[] }
model Response      { id, formId, answers[], submittedAt, isComplete }
model Answer        { id, responseId, blockId, value }
model Integration   { id, formId(→FormSettings), type, status, accessToken,
                      refreshToken, tokenExpiry, config, lastSyncAt, lastError }
model OAuthState    { id, state, userId, formId, type }
```

> ⚠️ **Important:** `Integration.formId` references `FormSettings.id`, NOT `Form.id`. The controller resolves this automatically via `getOrCreateSettingsId()`.

### Block Types
`SHORT_TEXT` · `LONG_TEXT` · `MULTIPLE_CHOICE` · `CHECKBOXES` · `DROPDOWN` · `NUMBER` · `EMAIL` · `PHONE_NUMBER` · `LINK` · `FILE_UPLOAD` · `DATE` · `TIME` · `RATING` · `LINEAR_SCALE` · `HEADING_1` · `HEADING_2` · `DIVIDER` · `IMAGE` · `NEW_PAGE`

---

## API Reference

All authenticated endpoints require the `x-user-id` header (Supabase user ID).

```
Base URL: https://intake-y4z3.onrender.com/api/v1
```

### Workspaces
```
GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id
DELETE /workspaces/:id
POST   /workspaces/:id/members
DELETE /workspaces/:id/members/:userId
```

### Forms
```
GET    /workspaces/:id/forms
POST   /workspaces/:id/forms
GET    /forms/:formId
PATCH  /forms/:formId
DELETE /forms/:formId
GET    /forms/slug/:slug          # Public — no auth
```

### Blocks
```
GET    /forms/:formId/blocks
POST   /forms/:formId/blocks
PATCH  /blocks/:blockId
DELETE /blocks/:blockId
POST   /forms/:formId/blocks/reorder
```

### Responses
```
POST   /forms/:formId/responses          # Public submit
GET    /forms/:formId/responses          # Auth required
DELETE /forms/:formId/responses          # Clear all
GET    /forms/:formId/responses/export
```

### AI
```
POST   /forms/:formId/ai-generate
POST   /forms/:formId/ai-generate-full
POST   /ai/chat
POST   /forms/:formId/ai/analyse
POST   /forms/:formId/ai/insights
POST   /forms/:formId/ai/suggest-blocks
POST   /forms/:formId/ai/apply-suggestion
POST   /forms/:formId/ai/translate
```

### Integrations
```
GET    /forms/:formId/integrations
DELETE /forms/:formId/integrations/:type
POST   /forms/:formId/integrations/notion/connect
GET    /integrations/notion/callback
POST   /forms/:formId/integrations/notion/setup
POST   /forms/:formId/integrations/google/connect
GET    /integrations/google/callback
POST   /forms/:formId/integrations/google/setup
```

### Other
```
POST   /verify-turnstile
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

---

## Environment Variables

### Backend (`.env`)
```env
# App
APP_URL=
API_URL=

# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini
GEMINI_API_KEY=AIza...

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Notion OAuth
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# Google OAuth (Sheets)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

> **Local dev Turnstile keys** (bypass challenge):
> Site key:  · Secret: 

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Supabase project (auth + DB)
- Google Cloud project (Gemini API + OAuth)
- Cloudinary account
- Notion integration (for Notion OAuth)
- Cloudflare Turnstile site

### Backend setup

```bash
cd backend
npm install
cp .env.example .env      # fill in all vars
npx prisma migrate dev
npx prisma generate
node index.js             # or: npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
npm install recharts react-markdown framer-motion
cp .env.example .env.local    # fill in all vars
npm run dev
```

### Add to `app/layout.tsx`
```tsx
import { GlobalProviders } from "@/components/GlobalProviders";
// Wrap children with <GlobalProviders>
```

---

## AI Features

All AI features use `gemini-2.5-flash-lite` on the Gemini free tier.

### Rate limits
The free tier allows ~50 requests/day. The backend handles 429 errors automatically with `generateWithRetry(model, prompt, maxRetries=2)`.

To increase limits: enable billing at [console.cloud.google.com](https://console.cloud.google.com).

### How each feature works

**AI Form Generator** — Takes a plain-English prompt, returns a structured JSON array of blocks. The editor merges them into the existing form.

**Full Form Generator** — Like the above but generates a complete form structure including headings, sections, and all question config in one shot.

**AI Assistant** — Stateless chat endpoint. Each message sends the form schema as context so Gemini can give form-specific advice.

**Response Analyser** — Sends all response data as context. Returns a structured analysis with sentiment, common themes, notable answers, and a plain-English summary.

**Smart Insights** — Free-form Q&A over your response data. Ask "What did most people say about pricing?" and get a direct answer.

**Block Suggestions** — Sends current block list; Gemini returns 3–5 recommended additional questions with type, label, and reason.

**Auto-Translate** — Sends all block labels and options; returns translated versions. Preview shown before applying so nothing is overwritten accidentally.

---

## Integrations

### Notion

1. User clicks **Connect Notion** → backend redirects to Notion OAuth
2. After authorisation, backend exchanges code for access token and fetches user's databases
3. User picks a database (or backend auto-creates one)
4. Backend patches the Notion DB schema to match form question types:
   - `EMAIL` → `email` property
   - `PHONE_NUMBER` → `phone_number` property
   - `NUMBER / RATING / LINEAR_SCALE` → `number` property
   - `MULTIPLE_CHOICE / DROPDOWN` → `select` property
   - `CHECKBOXES` → `multi_select` property (commas in option names are sanitised to ` /`)
   - Everything else → `rich_text` property
5. All existing responses are bulk-synced (350ms delay between requests to respect Notion's 3 req/s limit)
6. Every new form submission triggers `pushToNotion()` automatically

### Google Sheets

1. User clicks **Connect Google Sheets** → Google OAuth with `spreadsheets` + `drive.file` scopes
2. Backend auto-creates a new spreadsheet named `{Form Title} — Responses (Intake)`
3. Header row is auto-generated from form block labels and bolded with a blue background
4. All existing responses are bulk-synced immediately
5. Every new submission appends a row via `values:append`
6. Access tokens are auto-refreshed using the stored refresh token

---

## Deployment

### Frontend — Vercel
```bash
vercel --prod
```
Set all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard.

Add `intake-plum.vercel.app` to your Cloudflare Turnstile allowed hostnames.

### Backend — Render
- Build command: `npm install && npx prisma generate`
- Start command: `node index.js`
- Set all backend env vars in the Render dashboard

---

## Known Issues & Notes

| Status | Issue |
|---|---|
| ✅ Fixed | Integration FK references `FormSettings` not `Form` |
| ✅ Fixed | Google OAuth token exchange requires `application/x-www-form-urlencoded` |
| ✅ Fixed | Gemini 429 handling with `generateWithRetry()` |
| ✅ Fixed | Notion `multi_select` rejects commas in option names — sanitised to ` /` |
| ✅ Fixed | Turnstile blocked on `intake-plum.vercel.app` — hostname added to Cloudflare |
| ✅ Fixed | Double `/api/` in Turnstile verify URL |
| ⚠️ Remove before prod | `testPush` and `debugState` endpoints in `integration.routes.js` |
| ⚠️ Known | `removeMember` in `workspace.controller.js` uses `prisma` instead of `client` |
