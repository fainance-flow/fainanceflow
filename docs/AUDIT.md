# FinanceFlow — Codebase Audit

Produced during Phase 0 of the production-readiness effort (see the working
plan for the full phase breakdown). Scope: `backend/`, `frontend/`,
`mobile-app/`. Findings are marked:

- ✅ **fixed** — done in Phase 0, commit referenced
- ⏳ **scheduled** — real issue, fixed in a later phase (named below)
- ⏭ **won't-fix / accepted** — reviewed and deliberately left as-is, with why

Methodology: three parallel codebase sweeps (one per project) covering
structure, config, security-relevant code paths, and hygiene, each grounded
in exact file:line references; findings below were then spot-verified by
hand (reading the actual file, or running the actual tool) before being
acted on or filed here.

---

## 1. TypeScript strict mode & `any` types

| Project | `strict` | `noUncheckedIndexedAccess` | `any` / `as any` count |
| --- | --- | --- | --- |
| `backend/` | ✅ on | ✅ on | **0** |
| `frontend/` | ✅ on | off | **0** |
| `mobile-app/` | ✅ on (via `expo/tsconfig.base`) | — | **0** |

All three projects use `unknown` at the few boundaries that need loose
typing (error handlers, mapper inputs), never `any`. This was true before
Phase 0 and needed no fix — noted here because it's the exception, not the
rule, for a prototype-stage app.

⏭ **Not enabling `noUncheckedIndexedAccess` in frontend/mobile.** Backend
already has it; turning it on elsewhere now would surface a large batch of
array-index findings unrelated to the current phase's goal. Worth doing as
its own focused pass later, not bundled into hygiene.

---

## 2. Dead code

| Finding | Status |
| --- | --- |
| 11 zero-importer components in `frontend/src/components/common/` (`BrandDetector`, `BrandInitializer`, `BrandSwitcher`, `ThemeInitializer` — no-op `null` stubs; `Breadcrumb`, `Checkbox`, `DateRange`, `Drawer`, `Flex`, `Header`, `Pagination` — real but unused) | ✅ fixed — `7554aa0` |
| `uiSlice` (`sidebarCollapsed`/`toggleSidebar`) registered in the Redux store but never read by any component | ✅ fixed — `7554aa0` |
| `ff-grain-drift` / `ff-marquee` SCSS keyframes, never applied anywhere | ✅ fixed — `7554aa0` |
| No-op `glow-pulse` Tailwind keyframe (both stops fully transparent — a visual no-op even when triggered) and the matching unused `ff-glow-pulse` SCSS keyframe | ✅ fixed — `7554aa0` |
| `groupByDay`/`DayGroup` helper in `expensesView.tsx`, defined but never called | ✅ fixed — `3872ad4` |
| Unused imports: `CreditCard` (`(protected)/layout.tsx`), `DatePicker` (`loansView.tsx`) | ✅ fixed — `3872ad4` |
| Two unused category arrays in `backend/prisma/seed.ts` (seed data hardcodes categories inline instead) | ✅ fixed — `a631de0` |
| `framer-motion`, `@tanstack/react-query-devtools`, `@radix-ui/react-popover` installed but never imported (web) | ✅ fixed — `2b4525a` |
| `@react-native-async-storage/async-storage`, `@shopify/flash-list` installed but never imported (mobile — auth uses `expo-secure-store`, lists use RN `FlatList`) | ✅ fixed — `2b4525a` |
| `console-snippet.js` (70KB, ~500 real personal transactions), `seed-expenses.js`, `emulator-screenshot.png`, empty `DESIGN.md`, vendored `__pycache__` | ✅ fixed — `4922d6a` |

⏳ **`frontend/src/lib/finance-store/` (771-line local-first engine) and the
`shouldUseCloudFinance()` branch in every service file.** This is real,
large dead-weight-in-waiting — Loans and Subscriptions currently run on it
exclusively — but it's live code, not unused code, so removing it belongs
to Phase 4 (Loans & Subscriptions on the real API), once the backend routes
it would be replaced by actually exist.

---

## 3. `console.*` statements

| Project | Before | After | Where the remainder lives |
| --- | --- | --- | --- |
| `backend/src/` | 5 | 3 | `index.ts` (startup/shutdown log), `redis.ts` (connection log) |
| `backend/prisma/*.ts` (CLI scripts) | 24 | 24, now un-flagged | Legitimate CLI output — `no-console` is scoped off for `prisma/**` in `eslint.config.mjs` |
| `frontend/src/` | 1 | 1 | `lib/migrate-local-to-api.ts:101`, an error log |
| `mobile-app/` (app code) | 0 | 0 | — |
| `mobile-app/scripts/` | 2 | 2 | Build script output (`generate-icons.js`) |

⏳ **The 3 remaining backend `console.*` calls in `src/`.** Left alone
deliberately rather than hand-patched now: Phase 1 replaces `morgan` +
`console.*` wholesale with structured `pino` logging, and touching these
lines twice would be wasted motion.

⏭ **Prisma CLI scripts and the mobile build script.** `console.log` is the
correct output mechanism for a script meant to be run and read in a
terminal — flagging it was noise, not a finding, so the lint rule is scoped
off there instead of adding `no-console` suppressions line-by-line.

---

## 4. Hardcoded values & secrets

| Finding | File | Status |
| --- | --- | --- |
| **JWT secrets silently fall back to public literals** — `process.env.JWT_SECRET ?? "dev-access"` | `backend/src/utils/jwt.ts:4-5` | ⏳ Phase 1 (fail-fast env config) |
| Redis URL, CORS origin, port all have silent `??` fallbacks | `backend/src/{lib/redis.ts, app.ts, index.ts}` | ⏳ Phase 1 |
| `docker-compose.yml` hardcodes `JWT_SECRET: dev-jwt-secret-change-me`, DB password `financeflow` | `docker-compose.yml` | ⏳ Phase 8 (env split) |
| Password-reset token returned directly in the API response body | `backend/src/routes/auth.ts:174-177` | ⏳ Phase 3 |
| Real DB/demo credentials in a committed runbook | `backend/docs/local-setup-and-cors-fix.md` | ⏭ accepted — these are the same dev-only placeholder values already in `.env.example` and `docker-compose.yml`, not a distinct leak; the doc itself stays useful for onboarding |
| `frontend` axios `baseURL` and `metadataBase` both fall back to `localhost` | `frontend/src/libs/axios.ts:3`, `src/app/layout.tsx:24` | ⏳ Phase 3 (axios rewrite) / Phase 6 (`NEXT_PUBLIC_SITE_URL`) |
| Hardcoded personal email in a destructive script exposed as `npm run reset:user` | `backend/prisma/reset-user.ts:4` | ⏳ flagged for Phase 8 README/script review |

**No real secrets, keys, or certificates are committed anywhere in the
repo.** `git ls-files` across all three projects turns up only `.env.example`
templates with placeholder values (`please-change-me-in-production`); actual
`.env` files exist on disk but are correctly gitignored. This was verified,
not assumed.

---

## 5. Missing error boundaries

| Project | Finding | Status |
| --- | --- | --- |
| `frontend/` | **Zero error boundaries anywhere** — no `error.tsx`, `global-error.tsx`, or `componentDidCatch` at any level. A single render crash blanks the page. | ⏳ Phase 5 |
| `frontend/` | Only the dashboard view has a real error state (`FallBackState variant="error"` + retry); 7 other data views render nothing on fetch failure, and `accountsView.tsx` collapses an error into a misleading "No wallets yet" empty state. | ⏳ Phase 5 |
| `frontend/` | `reportsView.tsx` has no empty state — renders empty charts instead. | ⏳ Phase 5 |
| `mobile-app/` | No error boundary either, but every data-backed screen already has a `Banner`-based error state with retry (better baseline than web). | ⏭ mobile is out of scope this round per the agreed plan; noted for its own pass |
| `backend/` | Central `errorHandler.ts` exists and every async route is wrapped (`asyncHandler`) — no unhandled-rejection risk from route code. But `HttpError` never sets `this.name`, so every 4xx response returns `{"error":"Error"}` regardless of the actual error type. | ⏳ Phase 1 |

---

## 6. Tooling (the mechanism this audit runs on)

None of backend, frontend, or mobile had a working lint setup before Phase 0
— `frontend/package.json` declared `eslint`+`eslint-config-next` with no
config file at all; backend and mobile had no ESLint dependency whatsoever.
No project had Prettier, and there was no `.editorconfig`.

- ✅ Backend: flat `eslint.config.mjs` (typescript-eslint + `eslint-config-prettier`), Prettier, `lint`/`lint:fix`/`format`/`format:check` scripts, `engines.node`. — `a631de0`
- ✅ Frontend: `.eslintrc.json` extending `next/core-web-vitals` + `next/typescript` + `prettier`. **Deliberately not flat config** — `eslint-config-next@14.2.18`'s `@next/eslint-plugin-next` crashes under ESLint 9 flat config (`TypeError: context.getAncestors is not a function`, a removed legacy Rule API). Pinned `eslint@8.57` and used the classic config format the package was actually built for. — `3872ad4`
- ✅ Mobile: flat `eslint.config.js` via `eslint-config-expo/flat`, bootstrapped with `expo lint` so the version matches the installed Expo SDK exactly, plus Prettier. — `8e8ed25`
- ✅ One shared `.editorconfig` and `.prettierrc.json` at repo root; each project keeps a local `.prettierignore` (Prettier's ignore-file resolution is CWD-based, not upward-searching like its config resolution — a root-only ignore file silently missed `.next/`, `dist/`, etc. when scripts ran from inside a subproject). — `a2a225c`, plus local ignore files added alongside each project's tooling commit.

**Also found while wiring this up — `npm run build` was silently broken on
`master`.** `backend/tsconfig.json` included `prisma/**/*` but set
`rootDir: "./src"`, which is a contradiction TypeScript rejects
(`TS6059: file not under rootDir`). Nobody had noticed because the
Dockerfile runs `npm run dev`, never `npm run build`. Fixed by splitting
into `tsconfig.json` (src-only, used by `build`) and
`tsconfig.typecheck.json` (src + prisma, used by `typecheck`). ✅ `a631de0`

Every project is lint-clean (0 errors) and 100% Prettier-formatted as of
this commit. Remaining lint output is warnings only, listed below.

### Known lint debt (warnings, not errors — left for the phase that owns the fix)

| Warning | Files | Why not fixed now |
| --- | --- | --- |
| `react-hooks/exhaustive-deps` | `frontend/src/components/blocks/{reports,transactions}View.tsx` | Fixing requires restructuring `useMemo` dependencies, which is a behavior change, not a hygiene one — belongs with Phase 5's stability work where it can be tested properly |
| `react-hooks/exhaustive-deps` | `mobile-app/app/(protected)/(tabs)/accounts.tsx`, `mobile-app/components/QuickAddModal.tsx` | Same reasoning |
| `no-console` (3×) | `backend/src/index.ts`, `backend/src/lib/redis.ts` | Superseded wholesale by Phase 1's `pino` logging rework |

---

## 7. What Phase 0 deliberately did not touch

Everything below is real and was found during this audit, but fixing it
means changing behavior, not removing waste — each has a named owner phase
in the working plan, and is listed here so nothing gets lost between now
and then:

- Money serialized inconsistently (string on `/transactions`, float on
  `/dashboard/summary`) and 17 float coercions of `Decimal` values —
  **Phase 2**.
- Timezone-naive month-boundary math (`new Date(year, month-1, 1)`, local
  server time) — **Phase 2**.
- No rate limiting on any endpoint; `HS256` JWT verify with no algorithm
  allow-list; both tokens in `localStorage` on web — **Phase 3**.
- Loans/Subscriptions running on a local-only browser engine instead of the
  API — **Phase 4**.
- Missing loading/error/empty states across most web views — **Phase 5**.
- No SEO surface at all on the landing page (`frontend/public/` doesn't
  exist — no `robots.txt`, `sitemap.xml`, or OG image) — **Phase 6**.
- No tests anywhere in the repo, no error tracking, no analytics — **Phase 7**.
- Both Dockerfiles run `npm run dev` as the production `CMD`; no CI/CD;
  `docker-compose.yml` runs `prisma db push --accept-data-loss` plus a
  reseed on every container start — **Phase 8**.
