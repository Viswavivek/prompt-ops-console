# Prompt Ops Console

A **Prompt Management + n8n Workflow Operations** platform — React + TypeScript frontend for
managing, versioning, comparing, and executing AI prompts associated with n8n workflows.

The frontend consumes **backend REST APIs only**. It never connects to PostgreSQL or the n8n
database directly — the backend is the security boundary.

```
React Frontend  ──REST──▶  Backend APIs  ──▶  n8n  +  PostgreSQL (n8n_schema)
```

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | API contracts + assumptions | ✅ [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md), [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) |
| 1 | Scaffold: config, types, HTTP layer, service layer, JWT auth, mock backend, app shell | ✅ this build |
| 2 | Workflows, Workflow→Prompt mapping, Prompt editor, Version history, Diff | ⏳ |
| 3 | Trigger workflow, Executions list, Execution debugging | ⏳ |
| 4 | Global search, Token usage, Sync | ⏳ |
| 5 | Polish, hardening, docs | ⏳ |

## Tech stack

React 18 · TypeScript · Vite · React Router 6 · TanStack Query · Zustand · Tailwind CSS ·
axios · MSW (mock backend) · Monaco (planned) · react-diff-viewer-continued (planned) ·
@textea/json-viewer (planned) · sonner.

## Prerequisites

- Node.js **20+**
- npm

## Setup

```bash
npm install
npx msw init public/ --save   # one-time: installs the MSW service worker into public/
cp .env.example .env          # then edit as needed
```

## Run

```bash
npm run dev
```

By default (`VITE_USE_MOCKS=true`) the app runs against an **in-memory mock backend** (MSW) — no
real backend required.

**Mock credentials:**

| Email | Password | Role |
|---|---|---|
| `demo@promptops.dev` | `demo1234` | editor |
| `viewer@promptops.dev` | `viewer1234` | viewer |

### Point at a real backend

Set in `.env`:

```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://your-backend/api
```

The backend must implement the endpoints in [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md).
Anything marked 🟡 there is an assumption tracked in [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md);
open questions for the backend team are listed in that file's section **G (Q1–Q12)**.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Environment variables

| Var | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Backend API base URL |
| `VITE_HTTP_TIMEOUT_MS` | `20000` | Request timeout (triggers use 3×) |
| `VITE_AUTH_MODE` | `jwt` | Auth mechanism (only `jwt` implemented; swappable) |
| `VITE_AUTH_STORAGE` | `local` | JWT persistence: `local` or `memory` |
| `VITE_USE_MOCKS` | `true` | Serve API from MSW fixtures |
| `VITE_AUTO_SYNC_ON_START` | `false` | Call `POST /workflows/sync` once on startup |

## Project structure

```
src/
├── config/          # typed env access — the only place that reads import.meta.env
├── types/           # API models, mapped to n8n_schema tables + documented assumptions
├── services/        # API layer: http.ts (axios + error normalization) + one module per domain
│   ├── authApi · workflowApi · promptApi · promptVersionApi
│   ├── executionApi · searchApi · tokenApi
│   └── errors.ts    # ApiError + normalizeError (auth / http / timeout / network / bad-shape)
├── auth/            # modular JWT auth behind an AuthAdapter interface
│   ├── types.ts (AuthAdapter) · jwtAdapter.ts · adapter.ts (selector)
│   ├── authStore.ts (Zustand) · AuthProvider · ProtectedRoute · useAuth
├── lib/             # queryClient + query-key factory (qk), cn()
├── mocks/           # MSW: handlers/ + fixtures/ + db.ts (mutable in-memory store)
├── components/      # common/ layout/ workflows/ prompts/ versions/ executions/ search/ token-usage/
├── pages/           # Login/ Dashboard/ Workflows/ Prompt/ PromptCompare/ Executions/ Search/
├── routes/          # paths.ts + AppRoutes.tsx
├── hooks/ store/ utils/
└── App.tsx · main.tsx
```

### Architecture notes

- **API URLs are never hardcoded** — everything goes through `config.apiBaseUrl` + service modules.
- **Auth is modular** — the mechanism lives behind `AuthAdapter` (`src/auth/types.ts`). Swapping
  JWT for cookies/OIDC means writing one new adapter and registering it in `src/auth/adapter.ts`.
- **IDs are opaque strings** (`bigint` precision — see `docs/ASSUMPTIONS.md` B1). An ESLint rule
  blocks `parseInt` on `*Id` values.
- **Every service function returns a typed model** and throws a normalized `ApiError`.
- **Token data is never fabricated** — the token UI shows an explicit "not available" state when
  the backend has no data (`docs/ASSUMPTIONS.md` D1).
- The mock backend simulates real behavior: latency, 401s without a token, `409 STALE_VERSION`,
  `404 NO_PROMPT_MAPPED`, async workflow execution lifecycle, and async sync.

## Security

No PostgreSQL / n8n / backend credentials live in this app. The only secret it handles is the
user's JWT, stored per `VITE_AUTH_STORAGE`. Do not commit `.env`.
