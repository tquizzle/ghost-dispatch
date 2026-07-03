---
title: Multi-LLM Support, Database Abstraction, and Code Cleanup - Plan
type: feat
date: 2026-07-02
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

## Goal Capsule

Three interconnected concerns sequenced to minimize risk (LLM first as isolated change, then DB abstraction as larger refactor, cleanup last).

## Product Contract

### Actors
- Developer operating the tool (single user)
- External LLM provider (OpenAI-compatible API)
- Database backend (JSON file, SQLite, PostgreSQL)

### Flows
**F1: LLM Request Flow**
- User triggers an AI action via the UI
- Backend validates request and builds provider-agnostic prompt
- `callLLM()` posts to configured OpenAI-compatible endpoint
- Response parsed according to action type (text or JSON)
- Result returned to frontend for insertion/display

**F2: Database Flow**
- On startup, backend selects adapter based on `DB_ADAPTER` env var
- All data operations route through repository interface
- Runtime adapter switching updates in-memory repository reference
- Background scheduler persists data via same repository

### Acceptance Examples
**AE1: Multi-LLM Configuration**
- Given user sets `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` env vars
- When `/api/ai/generate` is called with any action
- Then request posts to `{LLM_BASE_URL}/chat/completions` with specified model
- And response is handled per action type (JSON parsed for SEO/tags, raw text for drafts/image prompts)

**AE2: Database Adapter Switching**
- Given `DB_ADAPTER=json` and existing `data/db.json`
- When user changes setting to `DB_ADAPTER=sqlite` via Settings UI
- Then background saves new config and instantiates `SQLiteRepository`
- And subsequent reads/writes use SQLite without server restart
- And all existing data appears intact (JSON→SQLite only; JSON↔SQLite bidirectional)

**AE3: PostgreSQL Connection Testing**
- Given `DB_ADAPTER=postgres` and valid `DATABASE_URL` in settings
- When user clicks "Test Connection" in PostgreSQL settings section
- Then backend attempts connection using `@neondatabase/serverless`
- And success/error is returned to UI for display

## Planning Contract

### Implementation Units

#### U1. LLM Configuration Types & Env Vars
**Goal:** Define provider-agnostic configuration interface and replace Gemini-specific env vars.
**Files:**
- Create: `src/types.ts` (add `LLMConfig` interface)
- Modify: `server.ts` (read LLM config from `process.env` alongside the existing config)
- Modify: `.env.example` (replace `GEMINI_API_KEY` with `LLM_*` vars and add `DB_ADAPTER`)
**Approach:**
- Add `LLMConfig` interface with `providerUrl`, `apiKey`, `model` fields
- Read these values in `server.ts` via `process.env` alongside the existing config loading
- Extend the POST `/api/config` endpoint to save LLM config alongside Ghost config
- The LLM config persists in the same JSON/DB store
- Add `DB_ADAPTER` to `.env.example` with default `json` for backward compatibility
**Dependencies:** None
**Test scenarios:**
- Setting LLM env vars makes them available to `callLLM()`
- Setting `DB_ADAPTER=sqlite` selects SQLite repository at startup
- Saving LLM config via Settings UI persists to DB and is readable on next load
- Default values work when no env vars or saved config present

#### U2. LLM Provider Client (OpenAI-Compatible)
**Goal:** Replace `@google/genai` calls with raw `fetch()` to any OpenAI-compatible endpoint.
**Files:**
- Delete: `node_modules/@google/genai` (from `package.json`)
- Create: `src/lib/llm-client.ts`
- Modify: `server.ts` (replace AI action handlers)
**Approach:**
- Build a `callLLM()` function that:
  - Accepts `{ action, prompt, ... }` where action is one of `generate_draft`, `optimize_seo`, `suggest_tags`, `generate_image_prompt`
  - Constructs provider-agnostic system prompt + user message
  - POSTs to `{baseUrl}/chat/completions` with `model`, `messages`, `temperature`, `max_tokens`
  - For `optimize_seo` and `suggest_tags`: sets `response_format: { type: "json_object" }` per OpenAI spec, plus a "json" marker in the system prompt. Falls back to `JSON.parse()` on the content string (with markdown fence stripping preserved).
  - For `generate_draft` and `generate_image_prompt`: returns raw text response (with markdown fence stripping for `generate_draft`)
  - Throws on HTTP errors with details from `response.error.message`
  - Provider returns malformed response (no choices) throws gracefully
  - Includes 5-second timeout and `AbortSignal` for `fetch()` calls to prevent hanging requests
- Replace the entire GoogleGenAI instantiation and model calls in `server.ts` with `await callLLM(...)`
- The 4 action-specific prompt templates move into `llm-client.ts` unchanged
- Preserve existing markdown fence stripping logic from `server.ts:581` for `generate_draft` output in the LLM client
**Dependencies:** U1
**Test scenarios:**
- Valid request returns expected text/JSON per action type
- Provider returns 401/403 surfaces the auth error in the response
- Provider returns malformed response (no choices) throws gracefully
- Request timeout triggers after 5 seconds and returns timeout error
- Invalid JSON response for SEO/tags actions falls back to manual parsing safely
- Markdown fences are properly stripped from `generate_draft` output for all providers
- Mock server verifies correct endpoint, headers, and body are sent

#### U3. Settings UI for AI Provider
**Goal:** Add UI for configuring LLM provider, with test connection.
**Files:**
- Modify: `src/components/SettingsView.tsx`
- Modify: `server.ts` (add POST `/api/ai/test` endpoint)
**Approach:**
- Add "AI Provider" section to SettingsView with:
  - Provider URL input (default: `https://api.openai.com/v1`)
  - API key input (password field)
  - Model input (default: `gpt-4o-mini`)
  - "Test Connection" button that POSTs to new `/api/ai/test` endpoint which runs a simple completion with timeout
- Extend POST `/api/config` endpoint to save LLM config alongside Ghost config
- The LLM config persists in the same JSON/DB store
**Dependencies:** U1
**Test scenarios:**
- Form controls update and save LLM config to backend
- "Test Connection" succeeds with valid OpenAI-compatible credentials
- "Test Connection" fails gracefully with invalid URL or bad API key
- Saved LLM config is used by subsequent AI actions
- Test connection respects timeout and aborts on hanging requests

#### U4. Repository Pattern & Adapter Interface
**Goal:** Define repository interface and base repository class.
**Files:**
- Create: `src/lib/repository.ts`
- Create: `src/lib/types.ts` (internal DB types if needed, or import from `src/types.ts`)
**Approach:**
- Define `Repository` interface with methods matching current `db` usage:
  - `getConfig(): GhostConfig`
  - `updateConfig(config: Partial<GhostConfig>): void`
  - `getPosts(): Post[]`
  - `getPostById(id: string): Post | null`
  - `createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post`
  - `updatePost(id: string, updates: Partial<Post>): void`
  - `deletePost(id: string): void`
  - `getActivityLog(): ActivityLogEntry[]`
  - `addLog(level: string, message: string): void`
  - `loadPosts(): Promise<void>` (for scheduler)
  - `savePosts(posts: Post[]): Promise<void>` (for scheduler)
- Create abstract `BaseRepository` implementing shared validation/logic
- Leave actual persistence to adapters
**Dependencies:** None
**Test scenarios:**
- Interface compiles without errors
- Abstract base class throws on unimplemented methods
- TypeScript validates all repository methods have correct signatures

#### U5. JSON File Adapter
**Goal:** Migrate existing JSON file persistence to repository interface.
**Files:**
- Create: `src/lib/repositories/json-repository.ts`
- Modify: `server.ts` (inject JSON repository)
**Approach:**
- Create `JSONRepository` implementing `Repository` interface
- On first load, create `data/db.json` with defaults if missing
- All methods read/write `data/db.json` synchronously (current behavior)
- Use atomic write pattern: write to temp file, rename
**Dependencies:** U4
**Test scenarios:**
- All repository methods work correctly with JSON file
- Concurrent writes are handled safely (file locking or queueing)
- Default data is created on first launch
- Existing `data/db.json` format is preserved and readable

#### U6. SQLite Adapter
**Goal:** Add SQLite backend using `better-sqlite3`.
**Files:**
- Create: `src/lib/repositories/sqlite-repository.ts`
- Add: `better-sqlite3` to `package.json`
**Approach:**
- Create `SQLiteRepository` implementing `Repository` interface
- On first load, create `data/ghost.db` with WAL mode enabled
- Create tables matching JSON schema if they don't exist
- For the initial seed data: insert SQL equivalent of the current JSON defaults
- All methods use parameterized queries to prevent injection
**Dependencies:** U4, U5 (for reference schema/data)
**Test scenarios:**
- All repository methods work correctly with SQLite database
- WAL mode allows concurrent reads and writes
- Database file is created with correct schema on first launch
- Seed data matches JSON defaults exactly
- Foreign key constraints are enforced

#### U7. PostgreSQL Adapter
**Goal:** Add PostgreSQL backend for Neon/Supabase/compatible services.
**Files:**
- Create: `src/lib/repositories/postgres-repository.ts`
- Add: `@neondatabase/serverless` and `pg` to `package.json`
**Approach:**
- Create `PostgresRepository` implementing `Repository` interface
- Use connection pool (`new Pool({ connectionString })`), single pool instance per server lifecycle
- Connection config: `DATABASE_URL` env var. Optionally read from settings config for runtime switching
- Explicit fallback logic: try `@neondatabase/serverless` first, catch error and fall back to `pg`
**Dependencies:** U4
**Test scenarios:**
- All repository methods work correctly with PostgreSQL database
- Connection falling back from `@neondatabase/serverless` to `pg` works correctly
- Database file is created with correct schema on first launch (via migrations)
- Seed data matches JSON defaults exactly
- Connection pooling works correctly under load

#### U8. Backend Migration to Repository Pattern
**Goal:** Replace all direct `loadDb()`/`saveDb()` calls in `server.ts` with the repository interface.
**Files:**
- Modify: `server.ts` (extensively)
**Approach:**
- At server startup, instantiate the correct repository adapter based on config/env:
  - If `DB_ADAPTER=sqlite`: instantiate `SQLiteRepository`
  - If `DB_ADAPTER=postgres`: instantiate `PostgresRepository`
  - Default: `JSONRepository` (backward compatible)
- Replace all `const db = loadDb()` calls with `await repo.getPosts()`, `await repo.getConfig()`, etc.
- Replace all direct array mutations with repository method calls
- Replace `saveDb(db)` calls - the repository methods handle persistence internally
- Update the scheduler to use `repo.getDueScheduledPosts()` and `repo.updatePost()`
- Update the `addLog()` helper to use `repo.addLog()`
- Keep the repository instance as a module-level variable so all handlers share it
**Dependencies:** U5 (U6 or U7 for actual runtime, but interface is sufficient for the refactor)
**Test scenarios:**
- All endpoints return identical data before and after migration (compare with JSON adapter)
- Post CRUD works correctly with each adapter
- Config save/load works across adapters
- Stats aggregation returns correct numbers
- Logging works correctly
- Scheduler finds and publishes due posts
- Scheduler is unaffected by which adapter is active
- Server starts without errors with no env var (defaults to JSON adapter)
- Server starts with `DB_ADAPTER=sqlite` env var
- Server starts with `DB_ADAPTER=postgres` env var and valid DATABASE_URL
**Execution note:** This is the highest-risk unit in the plan. Work incrementally: migrate one endpoint at a time and test manually between each change. Start with read-only endpoints (GET), then write endpoints (POST/PUT/DELETE), then the scheduler.

#### U9. Database Selection Settings UI
**Goal:** Add database adapter selection to the Settings UI, alongside the connection configuration for each adapter type.
**Files:**
- Modify: `src/components/SettingsView.tsx`
- Modify: `server.ts` (extend config endpoints for DB config)
- Modify: `src/types.ts` (add database config type)
**Approach:**
- Add a third section to SettingsView: "Database Backend" with:
  - Adapter type selector (dropdown: JSON File / SQLite / PostgreSQL)
  - For PostgreSQL: connection string input, test connection button
  - For JSON/SQLite: info text showing file path
- Extend the backend `/api/config` to store and serve the database selection alongside existing config
- On save, the backend updates the adapter in-memory. A restart is not required for JSON ↔ SQLite switch (both are local files); Postgres switch works immediately.
- Follow the same pattern as the Ghost CMS and LLM config sections
**Dependencies:** U8
**Test scenarios:**
- Switching from JSON to SQLite preserves existing data (automatic migration)
- Switching to PostgreSQL with valid connection string connects successfully
- Switching to PostgreSQL with invalid string shows error
- Current adapter is shown on page load
- File-based adapters show correct DB file path
- Added `DB_ADAPTER` env var in `.env.example` with default `json`
**Verification:** DB adapter selection saves and loads correctly, data persists after switching adapters in both directions.

#### U10. Final Cleanup and Documentation
**Goal:** Remove the `@google/genai` dependency, clean up dead code and AI Studio scaffolding, and update project documentation.
**Files:**
- Modify: `package.json` (remove `@google/genai`)
- Modify: `README.md`
- Modify: `.env.example` (final state)
- Modify: `metadata.json` (remove or update AI Studio reference)
- Possibly modify: `src/index.css` (remove unused imports)
- Possibly modify: `src/App.tsx`, `server.ts` (remove dead code)
**Approach:**
- Remove `@google/genai` from `package.json` dependencies. Run `npm install` to verify clean dependency tree.
- Scan all files for unused imports (TypeScript unused-import analysis via `tsc --noEmit`). Remove any found.
- Scan `server.ts` for the `aistudio-build` user-agent header — replace with a generic user-agent string.
- Review `metadata.json` — this is AI Studio metadata. Either remove it or update to reflect the project's standalone status.
- Update `README.md` to reflect the new LLM and DB configuration options. Add sections for provider setup and database adapter selection.
- Update `.env.example` with the final set of environment variables (replacing old Gemini vars).
- Run `npm run lint` and fix any new errors.
**Dependencies:** U2, U4, U8
**Test scenarios:**
- `npm run lint` passes with zero errors
- `npm run dev` starts successfully
- All 4 AI actions work after `@google/genai` removal
- All CRUD operations work after cleanup
- No references to `GoogleGenAI` or `@google/genai` remain in the codebase
- README correctly documents the new LLM and DB configuration options

## Verification Contract

| What | Command | Expected |
|------|---------|----------|
| TypeScript compilation | `npm run lint` | Zero errors |
| Dev server starts | `npm run dev` | Server listening on port 3000, no console errors |
| AI actions | Load app, open AI Assistant, run each action | All 4 actions return valid results |
| DB CRUD | Load app, create/edit/schedule/publish posts | All operations complete without errors |
| LLM config | Settings → LLM Provider, configure and test | Test succeeds, AI actions use new provider |
| DB switch | Settings → Database, switch adapter | Data persists across adapters |
| Scheduler | Schedule a post, wait for due time | Post auto-publishes, log entry created |

Run these verification scenarios for each adapter (JSON, SQLite, Postgres if available).

## Definition of Done

- [U1] LLM config types defined, env vars documented, defaults tested, defaults tested, DB_ADAPTER added to .env.example
- [U2] OpenAI-compatible LLM client implemented with timeout/abort signal, markdown fence stripping preserved, all 4 AI actions work with at least two providers
- [U3] Settings UI for LLM provider configuration complete with test connection
- [U4] AI Assistant UI is provider-agnostic, no "Gemini" branding remains in UI
- [U5] Repository interface defined, JSON file adapter wraps existing operations with no format change
- [U6] SQLite adapter implemented and passes full CRUD scenarios
- [U7] PostgreSQL adapter implemented and passes full CRUD scenarios (testable with Neon/Supabase)
- [U8] All API endpoints and scheduler use repository interface, no direct `loadDb()`/`saveDb()` calls remain
- [U9] Database adapter selection UI in settings, runtime switching works
- [U10] `@google/genai` removed, dead code cleaned, lint passes, README updated
- All cleanup criteria met: abandoned-attempt code is removed from the diff, no `@google/genai` references remain, no experimental dead ends left in the codebase