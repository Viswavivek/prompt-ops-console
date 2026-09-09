# Backend Assumptions

Every assumption the frontend makes about backend behavior or response shape that is **not** directly provable from the `n8n_schema` database schema. Each has: what we assume, why, the risk if wrong, and the frontend fallback.

> Referenced by [`API_CONTRACTS.md`](./API_CONTRACTS.md). Update this file whenever a contract is confirmed or changed — do not silently invent fields in code.

---

## A. Confirmed decisions (not assumptions, recorded for context)

| ID | Decision |
|---|---|
| D1 | **Auth is JWT.** Bearer token in `Authorization` header. Frontend stores it and rehydrates via `GET /auth/me`. |
| D2 | **Prompt body = `tbl_prompt_version.prompt_comment`.** There is no separate content column. |
| D3 | **Version number = `tbl_prompt_version.version`** (integer, unique). |
| D4 | Frontend does **not** connect to PostgreSQL or the n8n DB. All access is via backend REST. |

---

## B. Schema-derived assumptions

### B1. `bigint` IDs serialized as strings
- **Assume:** all `int8` primary keys (`prompt_id`, `workflow_id`, `task_id`, `promptversion_id`, `promptworkflow_id`) come back as JSON **strings**.
- **Why:** values can exceed `Number.MAX_SAFE_INTEGER`.
- **Risk:** if returned as numbers, large IDs corrupt silently.
- **Fallback:** frontend types all IDs as `string` and coerces defensively; a lint rule forbids `parseInt` on IDs.

### B2. Mapping table has no enforced FKs
- **Schema fact:** `tbl_prompt_workflowmapping_master.prompt_id` and `.workflow_id` are `NOT NULL` but have **no `FOREIGN KEY`** constraint.
- **Assume:** the backend still guarantees these point to real rows, and exposes the join pre-resolved (`GET /workflows/:id/prompt`).
- **Risk:** dangling mappings (prompt or workflow deleted).
- **Fallback:** UI handles "mapping exists but target missing" as an error card, distinct from "no mapping".

### B3. One prompt per workflow (for display)
- **Assume:** a workflow maps to **at most one** prompt for the primary "Workflow → Prompt" view, even though the mapping table is many-to-many.
- **Why:** the spec's mapping screen describes a single prompt.
- **Risk:** a workflow could have multiple mappings.
- **Fallback:** if `GET /workflows/:id/prompt` can return a list, the UI shows the first as primary and a "+N more" affordance; contract currently returns one object.

### B4. Current version = highest `version`
- **Assume:** the "current" prompt version is `MAX(version)` for that `prompt_id`. Backend SHOULD send `isCurrent` / `currentVersion` but the UI can compute it.
- **Risk:** backend may have an explicit "active version" pointer that differs from the max.
- **Fallback:** if `currentVersion` is present in responses, trust it over the computed max.

### B5. No "change summary" / commit-message column
- **Schema fact:** `tbl_prompt_version` has `prompt_comment` (the body) and audit columns, but **nothing** for a per-version change description.
- **Assume:** `POST /prompts/:id/versions` MAY accept an optional `changeSummary`; if unsupported it is ignored.
- **Risk:** version history has no human-authored "what changed" text.
- **Fallback:** the version-history UI derives a summary automatically — first non-empty line of `prompt_comment`, plus `+X / −Y chars` vs the previous version. The save dialog still collects a summary; it is sent as `changeSummary` and shown optimistically, but persistence depends on backend support. If the team wants durable summaries, add a column later — no UI change needed.

### B6. Audit fields populated by backend from JWT
- **Assume:** on create/update the backend sets `created_by` / `changed_by` from the JWT subject, not from a client-supplied value.
- **Why:** security — client must not assert identity.
- **Fallback:** frontend never sends `createdBy`/`changedBy` in write payloads.

### B7. `changed_by` nullable, `changed_at` defaulted
- **Schema fact:** `changed_by` is nullable; `changed_at` defaults to `CURRENT_TIMESTAMP`.
- **Assume:** a version never edited after creation has `changedBy = null` and `changedAt == createdAt`.
- **Fallback:** UI shows "—" for a null `changedBy` and hides "last modified" when it equals creation.

---

## C. n8n integration assumptions (not in schema at all)

### C1. Live workflow status
- **Assume:** `GET /workflows` includes `active` (boolean) and `updatedAt` sourced from n8n.
- **Risk:** these may lag behind n8n if sync is stale.
- **Fallback:** show `updatedAt` as "last synced" and surface sync status separately (§E).

### C2. n8n native workflow id
- **Assume:** each workflow row carries `n8nWorkflowId` distinct from the DB `workflow_id`, and triggering/executions use the n8n id (backend may translate internally).
- **Risk:** backend might key everything on the DB id.
- **Fallback:** frontend always passes the DB `workflowId` in URLs; backend owns any translation.

### C3. Execution data shape
- **Assume:** executions expose `status ∈ {queued, running, success, failed, cancelled}`, timestamps, `durationMs`, `triggerType`, and an `error` object.
- **Reality:** n8n's own statuses are roughly `new|running|success|error|canceled|waiting`. Backend is assumed to normalize to our five.
- **Fallback:** an unknown status renders as a neutral "Unknown" badge; the UI does not crash on unexpected enum values.

### C4. Node-level detail availability
- **Assume:** `GET /executions/:id` MAY include `nodes[]`, `timeline[]`, `input`, `output`, `failedNode`, and per-node `request`/`response`.
- **Risk:** n8n does not always retain full IO (depends on "save execution data" settings); HTTP request/response is only meaningful for HTTP nodes.
- **Fallback:** every one of these fields is treated as optional; each debug panel has its own empty state ("No input data was recorded for this execution").

### C5. Trigger input schema
- **Assume:** `GET /workflows/:id/execution-inputs` describes required trigger params.
- **Risk:** likely NOT available initially — n8n does not expose a clean input schema.
- **Fallback:** the Run dialog defaults to a JSON editor with client-side "valid JSON" validation; if the schema endpoint exists, it renders a typed form instead. No UI rewrite either way.

### C6. Execution → prompt/version linkage
- **Assume:** an execution MAY carry `promptRef: { promptId, version }` so the UI can show "this run used prompt v4".
- **Risk:** n8n has no native concept of our prompt versions.
- **Fallback:** if absent, the execution detail simply omits the "prompt used" section.

---

## D. Token usage assumptions (fully speculative)

### D1. Token data is optional and backend-provided
- **Assume:** endpoints `GET /token-usage/summary` and `GET /token-usage` exist eventually and return an `available` boolean.
- **Reality:** nothing in `n8n_schema` stores tokens. Token counts, if any, would come from LLM node output inside execution data.
- **Risk:** may never be implemented; may only be derivable per-execution.
- **Fallback:**
  - The token dashboard and per-entity token cards render a first-class "Token data not available yet" state.
  - The frontend **never** displays `0` or estimated/fabricated token numbers.
  - All token UI reads through `services/tokenApi.ts` so it activates automatically when the endpoint returns `available: true`.

### D2. Aggregation granularity
- **Assume:** if tokens exist per execution, the backend does the time-bucketing (`byDay`), not the frontend.
- **Fallback:** if only per-execution data is available, the frontend aggregates client-side over the current page of executions and labels it "based on loaded executions".

---

## E. Synchronization assumptions

### E1. Sync is a backend job
- **Assume:** `POST /workflows/sync` starts an async backend job that pulls from n8n into `tbl_workflow_master`; `GET /workflows/sync/status` reports progress.
- **Risk:** sync might be synchronous, or might not exist (workflows manually inserted).
- **Fallback:**
  - If `POST /workflows/sync` returns `200` with a completed status, the UI skips polling.
  - If neither sync endpoint exists, "Load / Refresh Workflows" degrades to a plain `GET /workflows` refetch, and the "last sync" indicator shows "Manual refresh only".

### E2. Dedupe key
- **Assume:** `workflowId` (DB id) is stable and unique per workflow across syncs.
- **Fallback:** the UI keys list rows and cache entries by `workflowId`; a duplicate id in a response is de-duplicated with a console warning.

### E3. Auto-sync is a client concern
- **Assume:** there is no server-driven push. "Auto-sync on startup" = the frontend calls `POST /workflows/sync` once per session on load (behind a user setting, default **off**).

---

## F. Cross-cutting assumptions

### F1. Pagination envelope
- **Assume:** list endpoints return `{ data, pagination }` as in the contract. 
- **Fallback:** if an endpoint returns a bare array, the client wraps it (`pagination` inferred as single page).

### F2. Error envelope
- **Assume:** errors follow `{ error: { code, message } }`.
- **Fallback:** if the body is a bare string or `{ message }`, the client normalizes it; unparseable bodies become `UNKNOWN_ERROR` with the HTTP status text.

### F3. Search endpoint
- **Assume:** `GET /search` exists and covers all six fields case-insensitively.
- **Fallback:** documented in contract §7 — client-side filter over loaded workflows/prompts, with a visible "limited search" note.

### F4. CORS & auth header
- **Assume:** backend allows the frontend origin and accepts `Authorization: Bearer`.
- **Risk:** cookie-based auth would change the client. Kept modular via `AuthProvider` (D1).

### F5. Timeouts
- **Assume:** normal calls complete within 20s; trigger calls within 60s.
- **Fallback:** configurable via `VITE_HTTP_TIMEOUT_MS` / per-call override.

### F6. Rate limiting
- **Assume:** if present, uses HTTP `429` + `Retry-After`.
- **Fallback:** client retries once after the header delay (or 2s), then surfaces the error.

---

## G. Open questions to confirm with the backend team

| # | Question | Blocks |
|---|---|---|
| Q1 | Are `bigint` IDs strings or numbers in JSON? | ID typing (B1) |
| Q2 | Is there an explicit "active/current version" pointer, or is it always `MAX(version)`? | Version history, editor (B4) |
| Q3 | Will `POST /prompts/:id/versions` persist a `changeSummary`? Add a column? | Version history UX (B5) |
| Q4 | Does `restore` create a new version server-side, or must the client re-save? | Version restore (§API 20) |
| Q5 | Can a workflow map to more than one prompt? | Mapping view (B3) |
| Q6 | What execution statuses does the backend emit, exactly? | Execution UI (C3) |
| Q7 | Is full node-level IO retained for executions? Under what settings? | Debug view (C4) |
| Q8 | Is there any token data anywhere in execution output today? | Token dashboard (D1) |
| Q9 | Do sync endpoints exist, and is sync async? | Sync UI (E1) |
| Q10 | Does `GET /search` exist, and does it search `prompt_comment`? | Global search (F3) |
| Q11 | Is there a trigger-input schema endpoint, or only free-form JSON? | Run dialog (C5) |
| Q12 | Token lifetime / refresh-token support? | Auth interceptor (D1) |
