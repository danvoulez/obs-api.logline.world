# REFURBISH PROMPT — obs-api.logline.world

## Context

This is the UBLX HQ observability dashboard for the LogLine ecosystem. It's a Next.js 15 app deployed on Vercel, consumed primarily from iPhone (PWA) and eventually from a Tauri desktop app on Mac.

The app was originally built to proxy all data requests through a Rust daemon (`logline-daemon`). That daemon has been permanently removed. The CLI (`logline-cli`) is the only infrastructure tool. This app is read-only observability — it reads data from the database and displays it. It never executes infrastructure commands.

**Database**: The app has a Drizzle ORM schema (`db/schema.ts`) that perfectly mirrors the Supabase Postgres tables. The Drizzle connection (`db/index.ts`) currently points at Vercel Postgres. All ecosystem data (users, tenants, apps, fuel, memberships) lives in Supabase. The UI-internal data (panels, components, settings, chat) also lives in the same Supabase database now.

**Auth**: Supabase Auth. The `@supabase/supabase-js` client is already configured in `lib/auth/supabase-browser.ts`. JWT tokens are passed via `Authorization: Bearer` headers.

**Companion repo**: `github.com/danvoulez/logic.logline.world` — owns the CLI, Rust crates, Supabase migrations, and all business logic. This repo NEVER contains business logic.

---

## What to DO

### Phase 1: Kill the daemon proxy (CRITICAL)

1. **DELETE** `lib/api/logline-client.ts` — the daemon proxy client. Every import of `callLogline` must be removed.

2. **DELETE** `lib/api/client.ts` — the old mock client with `USE_MOCKS || true`.

3. **DELETE** `mocks/ublx-mocks.ts` — mock data file.

4. **DELETE** `components/panel/GridCanvas.tsx` — unused, never imported.

5. **REWRITE every API route** in `app/api/` to use Drizzle ORM directly instead of `callLogline()`. The pattern is:

   **Before** (broken):
   ```typescript
   import { callLogline } from '@/lib/api/logline-client';
   export async function GET(req: NextRequest) {
     const upstream = await callLogline(req, '/v1/panels', 'GET');
     return new NextResponse(await upstream.text(), { status: upstream.status });
   }
   ```

   **After** (correct):
   ```typescript
   import { db } from '@/db';
   import { panels } from '@/db/schema';
   import { eq } from 'drizzle-orm';
   export async function GET(req: NextRequest) {
     const workspaceId = req.headers.get('x-workspace-id') || 'default';
     const appId = req.headers.get('x-app-id') || 'ublx';
     const rows = await db.select().from(panels)
       .where(eq(panels.workspace_id, workspaceId))
       .orderBy(panels.position);
     return NextResponse.json(rows);
   }
   ```

6. **Routes to rewrite** (all in `app/api/`):

   | Route | Method(s) | Table(s) | Notes |
   |-------|-----------|----------|-------|
   | `/api/panels` | GET, POST | `panels` | List/create panels |
   | `/api/panels/[panelId]` | PATCH, DELETE | `panels` | Rename/delete panel |
   | `/api/panels/[panelId]/components` | GET, POST | `panelComponents` | List/add components |
   | `/api/panels/[panelId]/components/[instanceId]` | PATCH, DELETE | `panelComponents` | Update/remove component |
   | `/api/instance-configs/[instanceId]` | GET, PUT | `instanceConfigs` | Read/write instance config |
   | `/api/effective-config/[instanceId]` | GET | `panelComponents` + `instanceConfigs` + `panelSettings` + `appSettings` | Compute cascade |
   | `/api/installed-components` | GET, POST | `installedComponents` | List/install components |
   | `/api/installed-components/[componentId]` | DELETE | `installedComponents` | Uninstall component |
   | `/api/tab-meta/[panelId]` | GET, PUT | `tabMeta` | Tab icon/label/shortcut |
   | `/api/panel-settings/[panelId]` | GET, PUT | `panelSettings` | Panel-level settings |
   | `/api/settings` | GET, PATCH | `appSettings` | App-wide settings |
   | `/api/chat` | GET, POST | `chatMessages` | Chat history |
   | `/api/status-log` | GET, POST | `serviceStatusLog` | Service health log |

7. **Routes to decide on** (v1 ecosystem routes):

   | Route | Current behavior | Decision |
   |-------|-----------------|----------|
   | `/api/v1/auth/whoami` | Proxies to daemon | Rewrite: query `users` + `tenantMemberships` using Supabase JWT |
   | `/api/v1/auth/onboard/claim` | Proxies to daemon | Rewrite: query `tenantEmailAllowlist`, create memberships |
   | `/api/v1/auth/tenant/resolve` | Proxies to daemon | Rewrite: query `tenants` by slug |
   | `/api/v1/cli/auth/challenge/*` | Proxies to daemon | Rewrite: CRUD on `cliAuthChallenges` table |
   | `/api/v1/founder/*` | Proxies to daemon | DELETE: founder operations are CLI-only |
   | `/api/v1/apps/[appId]/keys/user` | Proxies to daemon | Rewrite: query `userProviderKeys` |
   | `/api/logline/[...path]` | Generic daemon proxy | DELETE: daemon is gone |
   | `/api/llm-gateway/[...path]` | Proxies to LLM gateway | KEEP: proxies to external LLM gateway service, not daemon |

### Phase 2: Fix the database connection

1. **Update `db/index.ts`** to connect to Supabase Postgres instead of Vercel Postgres:
   - Use the Supabase connection string (from `SUPABASE_DB_URL` or `DATABASE_URL` env var)
   - Keep Drizzle ORM — the schema already matches Supabase tables perfectly
   - On Vercel, set the database URL in project environment variables

2. **Update `drizzle.config.ts`** to point at Supabase connection string for migrations (though migrations are managed by the CLI repo, Drizzle config is still needed for `drizzle-kit` introspection).

### Phase 3: Fix the daemon hooks in db-hooks.ts

1. **DELETE** these hooks from `lib/api/db-hooks.ts` (lines 520-599):
   - `useDaemonHealth`
   - `useDaemonRuntimeStatus`
   - `useDaemonWhoami`
   - `useDaemonEvents`
   - `useDaemonRunIntent`
   - `useDaemonStopIntent`
   - `useDaemonSelectProfile`

   These all call `/api/logline/v1/*` which no longer exists.

2. **Add replacement hooks** for ecosystem observability:
   ```typescript
   export function useEcosystemHealth() {
     return useQuery({ queryKey: ['ecosystem', 'health'],
       queryFn: () => apiFetch('/api/v1/auth/whoami'),
       refetchInterval: 30_000,
     });
   }

   export function useFuelEvents(appId?: string) {
     return useQuery({ queryKey: ['fuel', appId],
       queryFn: () => apiFetch(`/api/fuel-events?app_id=${appId}`),
       enabled: !!appId,
       refetchInterval: 30_000,
     });
   }

   export function useApps() {
     return useQuery({ queryKey: ['apps'],
       queryFn: () => apiFetch('/api/apps'),
     });
   }
   ```

### Phase 4: Fix components that use daemon hooks

1. **`components/shell/AppShell.tsx`**: Replace `useDaemonHealth()` with `useEcosystemHealth()` or remove the health indicator until real health checks are wired.

2. **`components/component-catalog/ObservabilityHub.tsx`**: Replace `useDaemonEvents`, `useDaemonRuntimeStatus` with ecosystem data queries (fuel events, app status).

3. **`components/component-catalog/LLMStatus.tsx`**: Replace `useDaemonHealth` with a direct Supabase query for LLM gateway status.

### Phase 5: Fix auth and loading

1. **`app/providers.tsx`**: Fix the `isRecovery` flag — it should reset to `false` after password change completes.

2. **`app/page.tsx`**: The loading state should not depend on daemon health. It should only wait for:
   - Supabase auth session resolution
   - Initial panels query
   
   If panels query fails, show empty state, not infinite loading.

3. **Add error boundaries**: Wrap the main content in a React error boundary so component failures don't crash the entire app.

### Phase 6: Clean up

1. **Delete** `scripts/check-template-rules.mjs` references to `logline/crates/logline-daemon/src/main.rs`
2. **Delete** `scripts/test-template-contract.mjs` references to daemon
3. **Update** `docs/` to remove daemon references
4. **Remove** `LOGLINE_DAEMON_URL` and `LOGLINE_DAEMON_TOKEN` from `.env.example`
5. **Add** `SUPABASE_DB_URL` to `.env.example`

---

## What to KEEP (do not touch)

- `components/shell/AppShell.tsx` — architecture is good (tabs, shortcuts, drag-drop)
- `components/panel/PanelRenderer.tsx` — panel rendering logic
- `components/panel/ComponentRenderer.tsx` — component wrapper with flip-to-settings
- `components/panel/TemplatePrimitives.tsx` — reusable primitives
- `components/component-catalog/ChatAI.tsx` — UI is solid, just fix data source
- `components/component-catalog/BillingDaily.tsx` — clean widget
- `components/component-catalog/ComponentStore.tsx` — search/filter/drag-drop
- `components/brand/LoglineMark.tsx` — branding
- `lib/config/component-template.ts` — template contract system
- `lib/config/component-settings.ts` — cascade settings resolution
- `stores/ui-store.ts` — Zustand store
- `types/ublx.ts` — type definitions
- `app/globals.css` — responsive grid
- `db/schema.ts` — Drizzle schema (perfectly mirrors Supabase)
- `lib/api/db-hooks.ts` — TanStack Query hooks structure (keep everything except daemon hooks)
- `lib/auth/supabase-browser.ts` — Supabase auth client
- `.cursor/rules/hq.mdc` — Cursor rules for this repo

---

## Rules

1. **API routes are data readers only** — SELECT, INSERT, UPDATE, DELETE on the database. They never make infrastructure decisions, never deploy, never migrate.
2. **No business logic in this repo** — if it sounds like a "rule" or "policy", it belongs in the CLI.
3. **Auth is Supabase JWT** — every mutating route should verify the JWT. Read routes can be public or gated depending on the table's RLS.
4. **The database is Supabase Postgres** — same database the CLI writes to. This app just reads what the CLI created.
5. **Keep the same API contract** — the hooks in `db-hooks.ts` call `/api/panels`, `/api/settings`, etc. Keep those URLs. Just change what's behind them (Drizzle instead of daemon proxy).
6. **Mobile first** — this is primarily an iPhone PWA. Every component must work on small screens.

---

## Database connection info

- Supabase URL: set via `NEXT_PUBLIC_SUPABASE_URL` env var
- Supabase Anon Key: set via `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var
- Database URL: set via `SUPABASE_DB_URL` env var (server-side only, for Drizzle)
- Schema: defined in `db/schema.ts` (21 tables, all matching Supabase migrations)

---

## Success criteria

After refurbish:
1. `npm run build` passes with zero errors
2. All API routes return real data from Supabase (no daemon, no mocks)
3. The app loads on mobile without getting stuck on "Initializing"
4. Panels can be created, renamed, deleted
5. Components can be added to panels and configured
6. Chat works (stores messages in `chatMessages` table)
7. No references to `logline-daemon`, `callLogline`, `MOCK_COMPONENTS`, or `DEFAULT_DAEMON_URL` remain in the codebase
8. `useDaemonHealth` and all daemon hooks are gone
9. The app authenticates via Supabase and shows the logged-in user
