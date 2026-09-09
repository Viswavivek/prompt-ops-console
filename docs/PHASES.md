# Project Phases & Build Plan

**Prompt Ops Console** — a Prompt Management + n8n Workflow Operations platform.
React + TypeScript frontend that consumes **backend REST APIs only** (never PostgreSQL or the
n8n database directly). The backend is the security boundary.

```
React Frontend  ──REST──▶  Backend APIs  ──▶  n8n  +  PostgreSQL (n8n_schema)
```

Related docs: [`API_CONTRACTS.md`](./API_CONTRACTS.md) · [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) · [`../README.md`](../README.md)

---

## Status at a glance

| Phase | Scope | Status |
|---|---|---|
| **0** | Analysis, API contracts, assumptions, data models | ✅ Done |
| **1** | Scaffold: config, types, HTTP/service layer, JWT auth, mock backend, app shell | ✅ Done |
| **2** | Workflows, Workflow→Prompt mapping, Prompt editor, Version history, Diff | ✅ Done |
| **3** | Trigger workflow, Executions list, Execution debugging | ⏳ Planned |
| **4** | Global search, Token usage, Workflow synchronization | ⏳ Planned |
| **5** | Polish, hardening, docs, delivery | ⏳ Planned |

Last updated: 2026-09-09 · Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean;
Phases 1–2 exercised end-to-end in the browser against the mock backend.

---

## Tech stack

| Concern | Choice |
|---|---|
| Build / framework | Vite + React 18 + TypeScript |
| Routing | React Router v6 (data router — needed for the unsaved-changes blocker) |
| Server state | TanStack Query v5 (caching, loading/error, refetch, debounced search) |
| Client state | Zustand (auth session, UI flags) |
| Styling | Tailwind CSS (light/dark tokens) + lucide-react icons |
| Prompt editor | Monaco (`@monaco-editor/react`) — JSON / Markdown / plain text |
| Diff | `react-diff-viewer-continued` (mature library, no hand-rolled diff) |
| JSON viewer | `@textea/json-viewer` (collapsible, large payloads) |
| Forms / validation | native + `zod` where needed |
| Toasts | `sonner` |
| HTTP | `axios` with interceptors |
| Mock backend | MSW (Mock Service Worker) |

---

## Phase 0 — Analysis & Contracts ✅

Goal: lock down the API surface and every backend assumption **before** writing UI.

| Step | Deliverable | Where |
|---|---|---|
| 0.1 | Requirements analysis, epic breakdown, backend-confirmed vs backend-assumed split | this doc |
| 0.2 | REST contract — 27 endpoints across 7 domains, tagged ✅ Confirmed / 🟡 Assumed / 🔵 Optional; error model, pagination envelope, status-code → UI-behavior table | [`API_CONTRACTS.md`](./API_CONTRACTS.md) |
| 0.3 | Backend assumptions with *what / why / risk / fallback*; 12 open questions (Q1–Q12) for the backend team | [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) |
| 0.4 | Frontend data models mapped to `n8n_schema` tables or a documented assumption | `src/types/*` |
| 0.5 | Service-layer design — one module per domain, all returning typed models | `src/services/*` |
| 0.6 | Page / component architecture | `src/` folder layout |

**Key decisions**
- Auth is **JWT** (bearer token), kept behind a swappable `AuthAdapter` interface.
- Prompt body = `tbl_prompt_version.prompt_comment`; version number = `tbl_prompt_version.version`.
- `bigint` IDs are opaque **strings** on the client (an ESLint rule blocks `parseInt` on `*Id`).
- Token-usage data is entirely assumed — the UI shows "not available", never fabricated numbers.

---

## Phase 1 — Foundation ✅

| Step | Deliverable | Where |
|---|---|---|
| 8 | Vite + React + TS scaffold; Tailwind; ESLint/Prettier; path alias `@/*`; scripts (`dev`, `build`, `preview`, `typecheck`, `lint`) | project root |
| 9 | HTTP + error layer — axios instance, Bearer injection, 401 → logout, `ApiError` + `normalizeError` covering auth / HTTP / timeout / network / malformed-body | `src/services/http.ts`, `src/services/errors.ts` |
| 10 | MSW mock backend — handlers for all 27 endpoints + seeded fixtures + a mutable in-memory `db.ts`; simulates latency, tokenless 401s, `409 STALE_VERSION`, `404 NO_PROMPT_MAPPED`, async execution lifecycle, async sync | `src/mocks/*` |
| 11 | Modular JWT auth — `AuthAdapter` interface → `jwtAdapter` → `adapter.ts` selector; Zustand `authStore` wired into the HTTP layer; session restore on boot via `GET /auth/me`; `ProtectedRoute` / `PublicOnlyRoute` | `src/auth/*` |
| 12 | App shell — left sidebar (Dashboard / Workflows / Prompts / Executions / Search), top bar (search, token pill, user menu, logout), responsive layout, toast host, error boundary; `queryClient` + `qk` key factory | `src/components/layout/*`, `src/lib/queryClient.ts` |

**Mock credentials:** `demo@promptops.dev` / `demo1234` (editor) · `viewer@promptops.dev` / `viewer1234` (viewer)

---

## Phase 2 — Core domain features ✅

### Step 13 — Workflows list
`src/pages/Workflows/WorkflowsPage.tsx`
- Table: name, ID, active/inactive status, mapped-prompt indicator, last-updated (relative).
- Debounced search, status filter, mapping filter, sortable columns, manual **Refresh**, pagination.
- `SyncStatusBar` — last-synced time, workflow count, "Sync from n8n" trigger, running/error states.
- Loading / empty / error states throughout.

### Step 14 — Workflow → Prompt mapping
`src/pages/Workflows/WorkflowDetailPage.tsx` + `src/components/workflows/WorkflowPromptPanel.tsx`
- Renders the `Workflow → Prompt → v(current)` relationship as chips.
- Full metadata: prompt name/ID/current version, created by/at, last modified by/at, workflow name/ID.
- Current prompt content preview; tasks / nodes list; workflow details sidebar.
- Distinct **"No prompt mapped"** empty state for `404 NO_PROMPT_MAPPED` (vs a real error).

### Step 15 — Prompt editor
`src/pages/Prompt/PromptPage.tsx` + `src/components/prompts/PromptEditor.tsx`
- Monaco editor; syntax toggle (plain / Markdown / JSON) with auto-detection.
- Pre-save validation (non-empty; valid JSON in JSON mode).
- View current version (editable) or any past version (read-only) from the history panel.

### Step 16 — Version history
`src/components/versions/VersionHistoryPanel.tsx`
- Lists every version: number, created by, created at, derived change summary, current indicator.
- Select any version to view its full content read-only.
- **Restore** → confirm dialog → creates a *new* version with that content (never overwrites history).

### Step 17 — Save / versioning flow
`src/components/prompts/SavePromptDialog.tsx` + `src/hooks/useUnsavedChangesGuard.tsx`
- Dirty detection → "unsaved changes" badge; router blocker + `beforeunload` guard.
- Save dialog shows a **derived change summary** (`first line + ±chars` — the schema has no summary column).
- `POST /prompts/:id/versions` with `baseVersion` for optimistic concurrency (`409 STALE_VERSION` handled).
- On success: history refetched, new version becomes current, editor rebinds to it.

### Step 18 — Prompt comparison / diff
`src/pages/PromptCompare/PromptComparePage.tsx` + `src/components/versions/VersionDiff.tsx`
- `react-diff-viewer-continued`; side-by-side / unified toggle; word-level highlighting.
- Version A / B pickers; deep-linkable (`/prompts/:id/compare?a=1&b=3`).
- Collapses unchanged regions for long prompts.

**Known items carried forward:** production bundle ~580 kB (code-split in Phase 5); sub-400px viewport
still has minor horizontal overflow (sidebar already collapses to icons below `lg`; desktop-first per spec).

---

## Phase 3 — Execution & operations ⏳

### Step 19 — Trigger n8n workflow
- "Run Workflow" modal: dynamic input form from `GET /workflows/:id/execution-inputs`, or a free-form
  JSON editor when no schema exists (assumption C5).
- Required-input validation; `POST /workflows/:id/execute` → `202 { executionId, status }`.
- Show execution ID + initial status; "Go to execution" link; actions disabled while in flight.

### Step 20 — Executions list
`src/pages/Executions/*`, `src/hooks/useExecutions.ts`
- Table: execution ID, workflow name, status (Queued / Running / Success / Failed / Cancelled),
  start, end, duration, trigger type, error summary.
- Filter by workflow / status / date; pagination; auto-poll running executions.

### Step 21 — Execution debugging view
- Tabs: Overview (timeline, failed node), Input, Output, Nodes (per-node status + IO), Error
  (message + request/response where present), Raw.
- Collapsible JSON viewers everywhere; each panel has its own empty state (data may not be retained).
- Optimized to answer "why did this run fail".

---

## Phase 4 — Cross-cutting features ⏳

### Step 22 — Global search
- Debounced (300 ms) `GET /search` across workflow names/IDs, prompt names/IDs, prompt content, versions.
- Results grouped **Workflows vs Prompts** (discriminated union); ⌘K palette; result → deep link.
- Fallback to client-side filtering over loaded lists if `/search` is unavailable.

### Step 23 — Token usage
- Dashboard cards: Today / Week / Month, Input / Output / Total.
- Per-workflow-execution and per-prompt-version breakdowns where present.
- First-class **"Token data not available yet"** state when the backend returns `available: false` or 404.
  Never renders `0` as if it were real data. All reads go through `services/tokenApi.ts`.

### Step 24 — Workflow synchronization
- Manual "Load / Refresh Workflows"; automatic sync-on-startup (behind a user setting, default off).
- Surface last sync time, workflow count, status, and errors.
- Dedupe by `workflowId`; degrade to a plain refetch if sync endpoints are absent.

---

## Phase 5 — Polish & delivery ⏳

| Step | Scope |
|---|---|
| 25 | UX pass — loading skeletons, empty/error states, confirm dialogs, disabled-during-request everywhere, keyboard shortcuts, virtualization audit on long lists |
| 26 | Design-system consistency — tokens, dark mode, component audit |
| 27 | Hardening — no secrets in source, token handling review, every API error path tested, `typecheck` + `lint` clean |
| 28 | Docs & runnable delivery — README (architecture, `.env`, run/build), full assumed-contract table, verify `npm run build` + `preview` |
| — | Bundle code-splitting (Monaco, diff viewer, JSON viewer) to clear the 500 kB warning |
| — | Responsive fixes below 400 px |

---

## Deliverables checklist

| # | Deliverable | Phase | Status |
|---|---|---|---|
| 1 | Complete React source code | 1–5 | 🟡 through Phase 2 |
| 2 | TypeScript types / models | 0–1 | ✅ |
| 3 | API service layer | 1 | ✅ |
| 4 | Authentication flow | 1 | ✅ |
| 5 | Workflow management UI | 2 | ✅ |
| 6 | Prompt management UI | 2 | ✅ |
| 7 | Prompt editor | 2 | ✅ |
| 8 | Prompt version history | 2 | ✅ |
| 9 | Prompt comparison / diff | 2 | ✅ |
| 10 | Workflow execution interface | 3 | ⏳ |
| 11 | Execution debugging interface | 3 | ⏳ |
| 12 | Global search | 4 | ⏳ |
| 13 | Token usage dashboard | 4 | ⏳ |
| 14 | Workflow synchronization / loading | 2 (bar) → 4 (full) | 🟡 |
| 15 | Error / loading / empty states | all | ✅ pattern established |
| 16 | Environment configuration | 1 | ✅ |
| 17 | README with setup & run instructions | 1 → 5 | ✅ initial |

---

## Development principles

- **API URLs are never hardcoded** — everything goes through `config.apiBaseUrl` + service modules.
- **Auth is modular** — swapping JWT for cookies/OIDC is one new adapter file.
- **Every service function returns a typed model** and throws a normalized `ApiError`.
- **The UI stays functional without a backend** — MSW implements the full assumed contract.
- **No invented backend fields** — every assumption is written down in [`ASSUMPTIONS.md`](./ASSUMPTIONS.md).
- **Modular by feature** so backend API changes don't force UI rewrites.
