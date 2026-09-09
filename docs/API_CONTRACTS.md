# API Contracts

> **Scope:** The REST surface the React frontend expects from the **backend APIs** (n8n workflows / a thin API layer).
> The frontend never talks to PostgreSQL or the n8n database directly — the backend is the security boundary.
>
> **Status legend**
> - ✅ **Confirmed** — backed by the existing `n8n_schema` tables or a stated decision.
> - 🟡 **Assumed** — the frontend needs this; backend shape is a proposal. Tracked in [`ASSUMPTIONS.md`](./ASSUMPTIONS.md).
> - 🔵 **Optional** — nice-to-have; UI degrades gracefully without it.

---

## 1. Conventions

| Aspect | Rule |
|---|---|
| Base URL | `${VITE_API_BASE_URL}` (e.g. `https://host/api`). No path is hardcoded elsewhere. |
| Format | `application/json` request and response bodies. UTF-8. |
| Auth | `Authorization: Bearer <JWT>` on every request except `POST /auth/login`. |
| IDs | `bigint` primary keys are serialized as **strings** (JS number precision). |
| Timestamps | ISO 8601 UTC, e.g. `2026-09-06T08:36:00Z`. |
| Pagination | Query: `page` (1-based), `pageSize` (default 25, max 100). Response envelope below. |
| Sorting | Query: `sort=<field>` and `order=asc\|desc`. Multiple: `sort=name&sort=updatedAt`. |
| Filtering | Domain-specific query params, documented per endpoint. |
| Partial text match | `search=` params are **case-insensitive substring** matches. |
| Correlation | Backend should echo `X-Request-Id`; frontend forwards it in error toasts. |

### Paginated response envelope

```jsonc
{
  "data": [ /* array of items */ ],
  "pagination": { "page": 1, "pageSize": 25, "total": 213, "totalPages": 9 }
}
```

### Error response model

All non-2xx responses use:

```jsonc
{
  "error": {
    "code": "INVALID_CREDENTIALS",      // stable machine string, SCREAMING_SNAKE_CASE
    "message": "Email or password is incorrect.", // human-readable, safe to display
    "details": { "field": "password" }, // optional, endpoint-specific
    "requestId": "req_01H..."            // optional
  }
}
```

| HTTP | Meaning | Frontend behavior |
|---|---|---|
| 400 | Validation / bad input | Show `error.message`; map `details.field` to form field errors. |
| 401 | Missing/expired/invalid JWT | Clear session, redirect to `/login` (except on the login call itself, which shows an inline error). |
| 403 | Authenticated but not allowed | Show "You don't have access to this." |
| 404 | Not found | Route-level empty state ("Workflow not found"). |
| 409 | Conflict (e.g. stale version) | Show conflict message, offer refresh. |
| 422 | Semantic validation failure | Same as 400. |
| 429 | Rate limited | Toast "Too many requests, retrying…"; respect `Retry-After`. |
| 5xx | Server error | Toast "Something went wrong on the server." + retry affordance. |
| Timeout / network | — | Normalized to `error.code = "NETWORK_ERROR"` / `"TIMEOUT"` client-side. |

Default client timeout: **20s** (execution-trigger calls: **60s**).

---

## 2. Authentication  ✅ (JWT decided)

### `POST /auth/login`
Request:
```jsonc
{ "email": "user@example.com", "password": "••••••" }
```
Response `200`:
```jsonc
{
  "token": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 3600,               // seconds; optional
  "refreshToken": "eyJ...",        // 🟡 optional; frontend uses if present
  "user": {
    "id": "42",
    "email": "user@example.com",
    "name": "Vivek T",
    "roles": ["editor"]            // 🟡 optional; drives UI gating if present
  }
}
```
Errors: `401 INVALID_CREDENTIALS`, `400 VALIDATION_ERROR`, `429 RATE_LIMITED`.

### `POST /auth/logout`  🔵
Invalidates the token/refresh server-side. Response `204`. Frontend clears local session regardless of outcome.

### `GET /auth/me`  ✅
Used on app load to rehydrate the session from a stored token.
Response `200`: `{ "user": { ...same shape as login.user } }`. `401` → treat as logged out.

### `POST /auth/refresh`  🟡 optional
Request `{ "refreshToken": "..." }` → same shape as login response. Used by the axios 401-retry interceptor when a refresh token exists.

---

## 3. Workflows

Backed by `tbl_workflow_master` (✅) enriched with live n8n data (🟡: `active`, `updatedAt`, `n8nWorkflowId`, `tags`).

### `GET /workflows`
Query: `search`, `status=active|inactive|all` (default `all`), `hasPrompt=true|false`, `sort=name|updatedAt|createdAt`, `order`, `page`, `pageSize`.

Item shape (`WorkflowListItem`):
```jsonc
{
  "workflowId": "1001",              // ✅ tbl_workflow_master.workflow_id
  "workflowName": "Invoice Summarizer", // ✅ workflow_name
  "n8nWorkflowId": "abc123",         // 🟡 n8n's native id, needed to trigger/list executions
  "active": true,                    // 🟡 n8n
  "updatedAt": "2026-09-01T12:00:00Z", // 🟡 n8n last-updated
  "createdAt": "2026-08-01T09:00:00Z",  // ✅ created_at
  "createdBy": "vivek",              // ✅ created_by
  "changedAt": "2026-09-01T12:00:00Z", // ✅ changed_at
  "changedBy": "vivek",              // ✅ changed_by
  "mappedPrompt": {                  // ✅ via tbl_prompt_workflowmapping_master; null if none
    "promptId": "7",
    "promptName": "invoice-system-prompt",
    "currentVersion": 4
  },
  "tags": ["finance"]                // 🟡 optional
}
```

### `GET /workflows/:workflowId`
`WorkflowDetail` = `WorkflowListItem` plus:
```jsonc
{
  "description": "…",                 // 🟡
  "taskCount": 6,                     // ✅ count of tbl_workflow_task
  "n8n": {                            // 🟡 raw-ish n8n metadata block, passed through
    "nodes": 12,
    "triggerType": "webhook",
    "versionId": "…"
  }
}
```

### `GET /workflows/:workflowId/tasks`  ✅
Backed by `tbl_workflow_task`. Returns `WorkflowTask[]`:
```jsonc
{
  "taskId": "5001",       // task_id
  "taskName": "Call LLM",  // task_name
  "nodeName": "OpenAI",    // node_name (nullable)
  "workflowId": "1001",    // workflow_id (FK)
  "createdAt": "…", "createdBy": "…", "changedAt": "…", "changedBy": "…"
}
```
Used to render node lists and to build the "Run Workflow" input form.

### `GET /workflows/:workflowId/prompt`  ✅
Resolves the mapping (`tbl_prompt_workflowmapping_master`) and returns the prompt with its **current** version inlined:
```jsonc
{
  "mapping": {
    "promptWorkflowId": "300",   // promptworkflow_id
    "promptId": "7",
    "workflowId": "1001",
    "createdAt": "…", "createdBy": "…"
  },
  "prompt": {
    "promptId": "7",
    "promptName": "invoice-system-prompt",
    "createdAt": "…", "createdBy": "…", "changedAt": "…", "changedBy": "…"
  },
  "currentVersion": {
    "promptVersionId": "9010",
    "promptId": "7",
    "version": 4,
    "promptComment": "You are an expert invoice assistant…", // = prompt body
    "createdAt": "…", "createdBy": "…", "changedAt": "…", "changedBy": "…"
  }
}
```
`404 NO_PROMPT_MAPPED` when the workflow has no mapping → UI shows the "no prompt mapped" empty state.

### `POST /workflows/:workflowId/prompt`  🔵
Create/replace the mapping. Body `{ "promptId": "7" }` → `201` with the mapping object. `DELETE` removes it.

---

## 4. Prompts

Backed by `tbl_prompt_master` (✅). **Prompt body lives in `tbl_prompt_version.prompt_comment`** (decided). Version number is `tbl_prompt_version.version` (✅).

### `GET /prompts`
Query: `search` (matches `prompt_name` and, 🟡, `prompt_comment`), `mappedOnly=true|false`, `sort=name|changedAt`, `order`, `page`, `pageSize`.

Item shape (`PromptListItem`):
```jsonc
{
  "promptId": "7",
  "promptName": "invoice-system-prompt",
  "createdAt": "…", "createdBy": "…", "changedAt": "…", "changedBy": "…",
  "currentVersion": 4,               // 🟡 max(version) for this prompt; UI falls back to computing it
  "versionCount": 4,                 // 🟡
  "mappedWorkflows": [               // ✅ via mapping table; [] if none
    { "workflowId": "1001", "workflowName": "Invoice Summarizer" }
  ]
}
```

### `GET /prompts/:promptId`
`PromptDetail` = `PromptListItem` plus `currentVersionContent` (the `promptComment` of the current version) for convenience.

### `GET /prompts/:promptId/versions`  ✅
Returns **all** versions, ordered by `version` **descending**. Shape (`PromptVersion`):
```jsonc
{
  "promptVersionId": "9010",   // promptversion_id
  "promptId": "7",             // prompt_id (FK)
  "version": 4,                // version (unique)
  "promptComment": "…full prompt body…", // prompt_comment
  "createdAt": "2026-09-01T12:00:00Z",   // created_at
  "createdBy": "vivek",                  // created_by
  "changedAt": "2026-09-01T12:00:00Z",   // changed_at
  "changedBy": "vivek",                  // changed_by (nullable)
  "isCurrent": true            // 🟡 convenience; else derived as version === max
}
```
> **No dedicated "change summary" column exists.** See [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) §Prompts. The UI derives a summary (first line / char delta) and, if `POST` accepts a `changeSummary`, stores it in `prompt_comment` metadata or a future column.

For large versions the list endpoint MAY omit `promptComment` when `?fields=summary` is passed; the UI then lazy-loads bodies per version.

### `GET /prompts/:promptId/versions/:version`  ✅
Single `PromptVersion` with full `promptComment`.

### `POST /prompts/:promptId/versions`  ✅ (create-new-version-on-save)
Request:
```jsonc
{
  "promptComment": "…new full prompt body…",
  "changeSummary": "Tightened system instructions",  // 🟡 optional; ignored if unsupported
  "baseVersion": 4                                    // 🟡 optional optimistic-concurrency check
}
```
Response `201`: the newly created `PromptVersion` (backend assigns `version = max(version) + 1`, sets `createdBy` from the JWT subject, `createdAt = now`).
- `409 STALE_VERSION` if `baseVersion` is not the latest → UI prompts to reload.
- Historical versions are **never** mutated.

### `POST /prompts/:promptId/versions/:version/restore`  🟡
Creates a **new** version whose `promptComment` equals version `:version`'s body. Response `201`: the new `PromptVersion`. If unsupported, the UI falls back to: load old body → open editor prefilled → user saves (which hits the normal `POST versions`).

### `POST /prompts`  🔵
Body `{ "promptName": "…" }` → `201` `PromptListItem`. Optional first version via `{ "promptName": "...", "promptComment": "..." }`.

---

## 5. Prompt Comparison

No dedicated endpoint required. The frontend fetches:
- `GET /prompts/:promptId/versions/:a`
- `GET /prompts/:promptId/versions/:b`

and diffs `promptComment` client-side with a mature diff library.

🔵 Optional server diff: `GET /prompts/:promptId/compare?a=3&b=4` →
```jsonc
{ "a": { "version": 3, "promptComment": "…" }, "b": { "version": 4, "promptComment": "…" } }
```

---

## 6. Workflow Executions (n8n)

🟡 Shapes modeled on n8n's execution data, surfaced through the backend.

### `GET /executions`
Query: `workflowId`, `status=queued|running|success|failed|cancelled`, `from`, `to` (ISO), `sort=startedAt`, `order`, `page`, `pageSize`.

Item shape (`ExecutionListItem`):
```jsonc
{
  "executionId": "e_88231",
  "workflowId": "1001",
  "n8nWorkflowId": "abc123",
  "workflowName": "Invoice Summarizer",
  "status": "failed",              // queued | running | success | failed | cancelled
  "startedAt": "2026-09-06T08:00:00Z",
  "stoppedAt": "2026-09-06T08:00:12Z", // null while running/queued
  "durationMs": 12043,                 // null until finished
  "triggerType": "webhook",            // manual | webhook | schedule | api | retry
  "mode": "trigger",
  "error": { "message": "OpenAI 429", "nodeName": "Call LLM" }, // null if none
  "tokenUsage": {                      // 🟡 null when not available — never fabricated
    "inputTokens": 1200, "outputTokens": 640, "totalTokens": 1840
  },
  "promptRef": { "promptId": "7", "version": 4 } // 🟡 optional, if backend links it
}
```

### `GET /executions/:executionId`
`ExecutionDetail` = `ExecutionListItem` plus:
```jsonc
{
  "input": { /* arbitrary JSON */ },   // 🟡 trigger payload / first-node input
  "output": { /* arbitrary JSON */ },  // 🟡 final output
  "failedNode": "Call LLM",            // 🟡
  "nodes": [                            // 🟡 node-level detail
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "status": "success",             // success | error | skipped | running
      "startedAt": "…", "finishedAt": "…", "durationMs": 12,
      "items": { "input": [ /* JSON */ ], "output": [ /* JSON */ ] },
      "error": null,
      "request": null, "response": null // 🟡 for HTTP-type nodes
    }
  ],
  "timeline": [                          // 🟡 ordered, for the timeline view
    { "nodeName": "Webhook", "startedAt": "…", "finishedAt": "…", "status": "success" }
  ]
}
```
Any 🟡 field may be `null`/absent → the corresponding panel shows an empty state.

### `POST /workflows/:workflowId/execute`  ✅ (trigger)
Request:
```jsonc
{
  "inputs": { "invoiceId": "INV-42", "locale": "en" }, // key/value; shape defined by the workflow
  "waitForCompletion": false                            // 🟡 if true, backend blocks up to 60s
}
```
Response `202`:
```jsonc
{ "executionId": "e_88232", "status": "queued" }
```
`400 MISSING_REQUIRED_INPUT` with `details.fields: ["invoiceId"]`.

### `GET /workflows/:workflowId/execution-inputs`  🟡
Describes required trigger inputs so the Run dialog can render a typed form:
```jsonc
{
  "fields": [
    { "name": "invoiceId", "label": "Invoice ID", "type": "string", "required": true },
    { "name": "locale", "type": "enum", "options": ["en","de"], "required": false, "default": "en" }
  ]
}
```
If absent, the Run dialog falls back to a free-form JSON editor.

---

## 7. Global Search

### `GET /search`  🟡
Query: `q` (required, min 2 chars), `type=all|workflow|prompt` (default `all`), `limit` (default 20).

Response:
```jsonc
{
  "results": [
    {
      "kind": "workflow",
      "workflowId": "1001",
      "workflowName": "Invoice Summarizer",
      "active": true,
      "match": { "field": "workflowName", "snippet": "…Invoice…" }
    },
    {
      "kind": "prompt",
      "promptId": "7",
      "promptName": "invoice-system-prompt",
      "version": 4,
      "match": { "field": "promptComment", "snippet": "…you are an <em>expert</em> invoice…" }
    }
  ]
}
```
Matches `workflow_name`, `workflow_id`, `prompt_name`, `prompt_id`, `prompt_comment`, `version`. Case-insensitive, partial. Frontend debounces at **300 ms**.

If `/search` is unavailable, the frontend falls back to client-side filtering over already-loaded `/workflows` and `/prompts` (documented degradation).

---

## 8. Token Usage  🟡 (entirely assumed — not in `n8n_schema`)

### `GET /token-usage/summary`
Query: `range=today|week|month|custom`, `from`, `to`.
```jsonc
{
  "available": true,                 // false → UI shows "Token data not available"
  "range": "week",
  "inputTokens": 2100000,
  "outputTokens": 1100000,
  "totalTokens": 3200000,
  "byDay": [ { "date": "2026-09-05", "input": 300000, "output": 150000, "total": 450000 } ]
}
```

### `GET /token-usage`  🟡
Query: one of `workflowId`, `promptId`, `executionId`.
```jsonc
{
  "available": true,
  "items": [
    { "executionId": "e_88231", "promptId": "7", "version": 4,
      "inputTokens": 1200, "outputTokens": 640, "totalTokens": 1840,
      "at": "2026-09-06T08:00:00Z" }
  ]
}
```

**Rule:** when `available` is `false` or the endpoint 404s, the UI renders an explicit "not available" state. It never shows `0` as if it were real data.

---

## 9. Workflow Synchronization

### `POST /workflows/sync`  🟡
Triggers a backend pull of workflows from n8n into `tbl_workflow_master`. Response `202`:
```jsonc
{ "syncId": "sync_01H...", "status": "running" }
```

### `GET /workflows/sync/status`  🟡
```jsonc
{
  "status": "success",              // idle | running | success | error
  "lastSyncAt": "2026-09-06T08:30:00Z",
  "workflowCount": 37,
  "added": 2, "updated": 5, "removed": 0,
  "errors": [ { "message": "n8n timeout for workflow abc999" } ],
  "durationMs": 4120
}
```
Frontend polls this every 2s while `status === "running"`. Dedupe key for the UI list is `workflowId`.

🔵 Auto-sync: no dedicated endpoint; "auto-sync on startup" is a **frontend setting** that calls `POST /workflows/sync` once on load, then `GET /workflows`.

---

## 10. Endpoint summary table

| # | Method | Path | Status | Feature |
|---|---|---|---|---|
| 1 | POST | `/auth/login` | ✅ | Login |
| 2 | POST | `/auth/logout` | 🔵 | Logout |
| 3 | GET | `/auth/me` | ✅ | Session rehydrate |
| 4 | POST | `/auth/refresh` | 🟡 | Token refresh |
| 5 | GET | `/workflows` | ✅/🟡 | Workflow list |
| 6 | GET | `/workflows/:id` | ✅/🟡 | Workflow detail |
| 7 | GET | `/workflows/:id/tasks` | ✅ | Workflow nodes/tasks |
| 8 | GET | `/workflows/:id/prompt` | ✅ | Workflow→Prompt mapping |
| 9 | POST/DELETE | `/workflows/:id/prompt` | 🔵 | Edit mapping |
| 10 | GET | `/workflows/:id/executions` | 🟡 | Executions for a workflow |
| 11 | GET | `/workflows/:id/execution-inputs` | 🟡 | Trigger form schema |
| 12 | POST | `/workflows/:id/execute` | ✅ | Trigger workflow |
| 13 | POST | `/workflows/sync` | 🟡 | Start sync |
| 14 | GET | `/workflows/sync/status` | 🟡 | Sync status |
| 15 | GET | `/prompts` | ✅ | Prompt list |
| 16 | GET | `/prompts/:id` | ✅ | Prompt detail |
| 17 | GET | `/prompts/:id/versions` | ✅ | Version history |
| 18 | GET | `/prompts/:id/versions/:v` | ✅ | Single version |
| 19 | POST | `/prompts/:id/versions` | ✅ | Save = new version |
| 20 | POST | `/prompts/:id/versions/:v/restore` | 🟡 | Restore version |
| 21 | POST | `/prompts` | 🔵 | Create prompt |
| 22 | GET | `/prompts/:id/compare` | 🔵 | Server-side diff |
| 23 | GET | `/executions` | 🟡 | Execution history |
| 24 | GET | `/executions/:id` | 🟡 | Execution detail / debug |
| 25 | GET | `/search` | 🟡 | Global search |
| 26 | GET | `/token-usage/summary` | 🟡 | Token dashboard |
| 27 | GET | `/token-usage` | 🟡 | Token breakdown |

---

## 11. Frontend service-layer mapping

| Service module | Endpoints |
|---|---|
| `services/authApi.ts` | 1–4 |
| `services/workflowApi.ts` | 5–9, 13–14 |
| `services/promptApi.ts` | 15, 16, 21 |
| `services/promptVersionApi.ts` | 17–20, 22 |
| `services/executionApi.ts` | 10–12, 23–24 |
| `services/searchApi.ts` | 25 |
| `services/tokenApi.ts` | 26–27 |

Each function returns a **typed model** from `src/types/`. HTTP/error normalization lives in `services/http.ts`; service modules never touch `axios` directly for error handling.
