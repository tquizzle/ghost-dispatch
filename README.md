# Ghost Dispatch — Ghost CMS Desktop Scheduler

An intuitive, desktop-optimized dashboard and content scheduler for **Ghost CMS**, featuring rich text editing, active publish scheduling, and an AI-powered drafting assistant powered by Google Gemini.

> **Brand name:** Ghost Dispatch (tagged `GD_` in the UI)  
> **Version:** 1.0

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [File-by-File Breakdown](#file-by-file-breakdown)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Shared Types](#shared-types)
- [Data Flow](#data-flow)
- [AI Integration](#ai-integration)
- [Configuration & Setup](#configuration--setup)
- [Dependencies](#dependencies)
- [Scripts](#scripts)
- [Design System](#design-system)

---

## Overview

Ghost Dispatch is a full-stack single-page application that serves as a **content manager and scheduler for Ghost CMS blogs**. It runs locally as an Express + Vite dev server and provides:

- A **dashboard** for monitoring publishing metrics
- A **rich HTML editor** with preview and AI-assistance
- A **background scheduler** that auto-publishes posts at configured times
- **Full Ghost CMS Admin API integration** for live publishing
- **Simulation mode** for offline testing without a live Ghost instance
- **AI-powered content tools** using Google Gemini

---

## Architecture

| Layer | Technology | Key Files |
|---|---|---|
| **Frontend** | React 19 + Tailwind CSS 4 + Lucide Icons + Motion | `src/` directory |
| **Backend** | Express.js (Node + TypeScript via `tsx`) | `server.ts` |
| **Build** | Vite (frontend) + esbuild (server bundle) | `vite.config.ts` |
| **Storage** | JSON file-based database | `data/db.json` (auto-created) |
| **AI** | Google Gemini (`@google/genai` SDK, model `gemini-3.5-flash`) | `server.ts` — `/api/ai/generate` |
| **Styling** | Tailwind CSS 4 — dark brutalist theme | `src/index.css` |

```
┌─────────────────────────────────────────────┐
│            React SPA (Vite)                  │
│  Dashboard │ Editor │ Schedules │ Logs │ ... │
└──────────────────┬──────────────────────────┘
                   │ fetch()
                   ▼
┌─────────────────────────────────────────────┐
│         Express API (server.ts)              │
│  CRUD │ Config │ Upload │ AI │ Publish       │
└──────┬──────────────────────────┬───────────┘
       │                          │
       ▼                          ▼
┌──────────────┐     ┌──────────────────────┐
│  data/db.json │     │   Ghost CMS Admin    │
│ (local FS)    │     │   API (live publish) │
└──────────────┘     └──────────────────────┘
```

---

## Key Features

### 📊 Dashboard
- Stats tiles: Published, Scheduled, Drafts, Failed counts
- Next scheduled post with live countdown timer
- Recent publications & drafts quick-list
- Embedded real-time activity log (last 8 entries)
- Connection status indicator (green = online, red = offline)

### ✍️ Rich HTML Editor
- Split-pane: Write HTML tab + Render Preview tab
- Image upload via drag-and-drop or URL input
- Featured article toggle, tag management, excerpt editing
- Status badges (draft / scheduled / published / failed)

### 📅 Publishing Timeline
- Chronological list of all scheduled posts with countdowns
- Reschedule capability (opens the editor)
- Recently published history
- Explainer card on how background scheduling works

### ⏰ Background Scheduler Engine
- Runs every **10 seconds** (`setInterval` in `server.ts`)
- Checks for posts with `status: "scheduled"` and `scheduled_at <= now`
- Automatically publishes due posts to connected Ghost CMS
- Falls back to simulation mode if no Ghost connection is active

### 🔗 Ghost CMS Integration
- Full Admin API integration with custom JWT token generation
- Test & Save connection workflow
- Supports both **Blog Posts** and **Static Pages**
- Masked API key transmission for security
- Auto-publishes HTML content via Ghost's `?source=html` parameter

### 🤖 AI Assistant (Gemini)
- **Draft Generator** — writes structured HTML blog posts from a text prompt
- **SEO Optimizer** — analyzes title/content, generates optimized SEO title, meta excerpt, and tags
- **Image Prompt Builder** — creates detailed prompts for text-to-image tools (like Imagen)
- All powered by `gemini-3.5-flash` via the `@google/genai` SDK

### 🔍 Content Library
- Search by title, tags, or excerpts
- Filter by content type (post/page) and status (draft/scheduled/published/failed)
- Grid view with feature image thumbnails and tag chips

### 📋 Activity Logs
- Full audit trail with search and type filtering
- Log types: success, info, warning, error
- Expandable detail panels
- Clear logs functionality

### 🧪 Simulation Mode
- Full functionality without a live Ghost CMS
- All publishing, scheduling, and logs work offline
- Perfect for testing and development

---

## Project Structure

```
ghost-post/
├── index.html                    # Vite entry HTML
├── metadata.json                 # AI Studio project metadata
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── server.ts                     # Express backend (757 lines)
├── .env.example                  # Environment variable template
├── .gitignore
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main application shell (5 tabs, routing)
│   ├── index.css                 # Tailwind CSS + global styles
│   ├── types.ts                  # Shared TypeScript types
│   └── components/
│       ├── Dashboard.tsx         # Overview dashboard
│       ├── EditorView.tsx        # Rich HTML editor with preview
│       ├── SchedulesView.tsx     # Publishing timeline
│       ├── SettingsView.tsx      # Ghost CMS connection config
│       ├── LogsView.tsx          # Activity audit log
│       └── AIAssistant.tsx       # Gemini AI copilot sidebar
├── assets/
│   └── .aistudio/               # AI Studio metadata
└── data/                         # Created at runtime
    ├── db.json                   # JSON database (posts, config, logs)
    └── uploads/                  # Uploaded images
```

---

## File-by-File Breakdown

### Backend

#### `server.ts` (757 lines)
The core Express server with all API endpoints and business logic.

**Key API Endpoints:**

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/config` | GET | Retrieve Ghost CMS config (masked API key) |
| `/api/config` | POST | Save & test Ghost CMS connection |
| `/api/stats` | GET | Aggregated dashboard statistics |
| `/api/posts` | GET | List all posts (sorted by updated_at) |
| `/api/posts` | POST | Create a new post |
| `/api/posts/:id` | GET | Get a single post |
| `/api/posts/:id` | PUT | Update a post |
| `/api/posts/:id` | DELETE | Delete a post |
| `/api/posts/:id/publish-now` | POST | Publish immediately to Ghost CMS |
| `/api/upload` | POST | Upload image (base64) |
| `/api/ai/generate` | POST | Gemini AI content generation |
| `/api/logs` | GET | Retrieve activity logs |
| `/api/logs/clear` | POST | Clear all logs |

**Notable internals:**

- **`createGhostToken(apiKey)`** — Generates Ghost Admin API JWT tokens manually using Node's `crypto` module (no external JWT library required). Creates HS256-signed tokens with a 5-minute expiry.
- **`ghostApiRequest()`** — Generic fetch wrapper for Ghost Admin API calls with authorization header injection.
- **`publishPostToGhost()`** — Publishes a post/page to Ghost CMS via the Admin API. Falls back to simulation mode when no connection is configured.
- **`runSchedulerCheck()`** — Background function that finds and publishes due scheduled posts. Runs every 10 seconds.
- **`addLog()`** — Structured logging to both `data/db.json` and stdout. Caps at 200 entries.

**AI Endpoints (4 actions):**

1. `generate_draft` — Free-form prompt → structured HTML blog post
2. `optimize_seo` — Title + Content → `{ optimizedTitle, metaExcerpt, suggestedTags }`
3. `suggest_tags` — Title + Content → `["tag1", "tag2", ...]`
4. `generate_image_prompt` — Title + Excerpt → creative prompt string

### Frontend

#### `src/App.tsx` (~544 lines)
The main application shell:

- **Dark sidebar navigation** with 5 tabs: Dashboard, Content Library, Publishing Timeline, Controller Logs, Settings Portal
- An **Editor tab** activates when a post is selected for editing
- **6-second polling** (`setInterval`) to keep data in sync with the backend
- System status footer showing Ghost connection state
- Search and filter controls for the Content Library
- Handles all top-level CRUD operations: create, save, publish, delete
- Branded as **"Ghost Dispatch 1.0"** (logo: `GD_`) with a cyberpunk aesthetic

#### `src/components/Dashboard.tsx` — Overview Hub
- Stats tiles for published/scheduled/drafts/failed counts
- Next scheduled post card with countdown
- Recent posts quick-list
- Embedded activity log panel (last 8 entries)
- Scheduler status indicator (animated green pulse)

#### `src/components/EditorView.tsx` (~575 lines)
The main writing workspace:

- **Write / Preview tabs** — HTML textarea vs. rendered preview
- **Image management** — drag-and-drop upload zone, URL fallback, preview thumbnail
- **Metadata panel** — title, excerpt, tags, content type selector, featured toggle
- **Publishing controls:**
  - Save Draft
  - Schedule Publication (datetime-local picker with validation)
  - Cancel Schedule (reverts to draft)
  - Publish Instantly (with confirmation dialog)
- **AI Assistant sidebar** — toggleable panel with Gemini tools
- Status badges, error/success message banners
- Character count display

#### `src/components/SchedulesView.tsx` — Publishing Timeline
- Chronological list of scheduled posts with countdown timers
- Recently published history (last 5)
- Reschedule buttons linking to the editor
- Visual timeline indicator (left green bar per item)
- Empty state with call-to-action

#### `src/components/SettingsView.tsx` — Ghost CMS Connection
- Form for Ghost Blog URL and Admin API Key
- Test & Save / Disconnect Blog buttons
- Connection status indicator with site title display
- Simulation mode explainer card
- API credentials step-by-step guide

#### `src/components/LogsView.tsx` — Activity Audit Log
- Full log history with search input
- Type filter buttons (All / Success / Info / Warning / Error)
- Expandable detail panels per log entry
- Refresh and Clear controls

#### `src/components/AIAssistant.tsx` — Gemini AI Copilot
Three AI-powered tools in a slide-out sidebar:

1. **Draft Generator** — text prompt → structured HTML (with "Apply to Editor" button)
2. **SEO Optimizer** — analyzes title/content → optimized title + excerpt + tags (with "Apply" button)
3. **Image Prompt Builder** — generates creative prompts for text-to-image generators (with "Copy" button)

Each tool has its own loading state, error handling, and success confirmation.

### Shared Types

#### `src/types.ts`
```typescript
GhostConfig   — apiUrl, adminApiKey, isConnected
PostStatus    — 'draft' | 'scheduled' | 'published' | 'failed'
ContentType   — 'post' | 'page'
Post          — Full post model with scheduling, tags, Ghost metadata
ActivityLog   — id, timestamp, type, message, details
DashboardStats — Aggregated publishing metrics
```

---

## Data Flow

```
User actions (React UI)
       │
       ▼
  fetch() calls to Express API
       │
       ▼
  Express routes (server.ts)
       │
       ├─── Reads/writes data/db.json (local JSON storage)
       │
       └─── [Optional] Ghost CMS Admin API
                 │
                 ├─── Publishes posts live (when connected)
                 └─── Falls back to simulation mode (when offline)

  Background Scheduler (every 10s)
       │
       ├─── Scans data/db.json for due scheduled posts
       └─── Publishes them automatically via the same Ghost API path
```

---

## AI Integration

The app uses **Google Gemini** via the `@google/genai` SDK.

- **Model:** `gemini-3.5-flash`
- **SDK:** `@google/genai` v2.4+
- **API Key:** Configured via `GEMINI_API_KEY` environment variable
- **User-Agent:** `aistudio-build`

**Four AI Actions:**

| Action | Input | Output | Schema |
|---|---|---|---|
| `generate_draft` | Text prompt | Raw HTML content | Free text |
| `optimize_seo` | Title + HTML content | `{ optimizedTitle, metaExcerpt, suggestedTags }` | Structured JSON (typed) |
| `suggest_tags` | Title + HTML content | `["tag1", "tag2", ...]` | JSON array (typed) |
| `generate_image_prompt` | Title + excerpt | Natural language prompt | Free text |

The `optimize_seo` and `suggest_tags` actions use Gemini's **structured output** (`responseMimeType: "application/json"` + `responseSchema`) to guarantee valid JSON responses.

---

## Configuration & Setup

### Prerequisites

- Node.js >= 18
- npm

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Required for Gemini AI features
GEMINI_API_KEY="your-gemini-api-key"

# Optional: URL where the app is hosted (for self-referential links)
APP_URL="http://localhost:3000"
```

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set GEMINI_API_KEY in .env.local (see .env.example)

# 3. Start the development server
npm run dev

# 4. Open browser to http://localhost:3000
```

### Using with a Live Ghost CMS

1. Go to **Settings** tab in the app
2. Enter your **Ghost Blog URL** (e.g., `https://your-blog.ghost.io`)
3. Generate an **Admin API Key** from Ghost Admin → Settings → Integrations → Custom Integration
4. Click **Test & Save Connection**

The app will automatically detect the connection. Without a connection, it runs in **Simulation Mode** so you can test everything offline.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | ^19.0 | UI framework |
| `express` | ^4.21 | HTTP server & REST API |
| `vite` | ^6.2 | Build tool & dev server |
| `@vitejs/plugin-react` | ^5.0 | React integration for Vite |
| `@google/genai` | ^2.4 | Google Gemini AI SDK |
| `@tailwindcss/vite` | ^4.1 | Tailwind CSS Vite plugin |
| `tailwindcss` | ^4.1 | Utility-first CSS framework |
| `lucide-react` | ^0.546 | Icon library |
| `motion` | ^12.23 | Animation library |
| `dotenv` | ^17.2 | Environment variable loading |

**Dev Dependencies:**

| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler & type checking |
| `tsx` | TypeScript execution (dev server) |
| `esbuild` | Server bundling for production |
| `@types/node` | Node.js type definitions |
| `@types/express` | Express type definitions |
| `autoprefixer` | CSS vendor prefixing |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Vite middleware + Express) |
| `npm run build` | Build frontend (Vite) + bundle server (esbuild) |
| `npm start` | Run production server from `dist/` |
| `npm run clean` | Remove `dist/` directory |
| `npm run lint` | TypeScript type-checking (`tsc --noEmit`) |

---

## Design System

The UI follows a **dark brutalist cyberpunk** theme:

- **Background:** `#111113` (canvas) / `#1A1A1C` (panels)
- **Accent:** `#00FF9D` (neon green) — interactive elements, highlights, status indicators
- **Typography:**
  - **Syne** (font-syne) — bold headings and view titles
  - **Inter** (font-sans) — body text and general UI
  - **Space Mono** (font-mono) — status metadata, logs, schedule fields, terminal-like elements
- **Borders:** `#333333` — sharp, no border-radius (`rounded-none` throughout)
- **Error:** `#FF5F57` (macOS close-button red)
- **Warning:** amber-500
- **Info:** blue-400

All UI elements use a consistent **border-based navigation style** with uppercase tracking, monospace labels, and neon green hover/focus states.

---

## Background Scheduler Details

The scheduler engine in `server.ts`:

```typescript
// Runs every 10 seconds
setInterval(runSchedulerCheck, 10000);
```

**What it does:**
1. Loads `data/db.json`
2. Finds all posts where `status === "scheduled"` and `scheduled_at <= now`
3. For each due post:
   - If connected to Ghost CMS: publishes via Admin API
   - If offline: simulates the publish (generates fake `ghost_id` and `ghost_url`)
4. Updates post status to `published` (or `failed` on error)
5. Logs all actions to the activity log
6. Saves changes to `data/db.json`

The frontend **also polls every 6 seconds** (`App.tsx`) to reflect scheduler updates in real-time.

---

## Publishing to Ghost CMS

The app uses **Ghost Admin API** with custom JWT authentication:

1. Generates a short-lived (5 min) HS256 JWT token using the Admin API Key
2. Posts content via `/{posts|pages}/?source=html` endpoint
3. Supports HTML content, feature images, tags, excerpts, and featured status
4. Image uploads are stored locally; full remote URL resolution is supported via `APP_URL`

---

## Notes

- This project was scaffolded in **Google AI Studio** (evidenced by `aistudio-build` user-agent, `metadata.json`, and Vite HMR configuration)
- The file-based database (`data/db.json`) is **not intended for production** multi-user scenarios — it's designed for local/single-user desktop-style use
- Uploaded images are stored in `data/uploads/` and served statically via `/uploads/`