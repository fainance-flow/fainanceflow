# FinanceFlow — Engineering Rules

These rules are enforced for **all new code**. Existing files that pre-date a rule may stay until refactored; new work must comply.

> ⚠️ When you change structure, packages, or features, **update this file in the same PR**.

---

## Component Rules

### Location

| Kind                     | Folder                       |
| ------------------------ | ---------------------------- |
| Single-purpose UI        | `src/components/common/`     |
| Forms / listings / views | `src/components/blocks/`     |
| App shell layout         | `src/components/layout/`     |

Each component lives in its own folder with `index.tsx` as the entry:

```
src/components/common/MyComponent/
  ├── index.tsx        ← component (default export)
  └── types.ts         ← component-local types (optional)
```

### Structure

```tsx
// src/components/common/MyComponent/index.tsx
import React from "react";

type Props = {
  label: string;
  onClick?: () => void;
};

const MyComponent = ({ label, onClick }: Props) => {
  return <button onClick={onClick}>{label}</button>;
};

export default MyComponent;
```

- **Default export only** from `index.tsx`. Named exports are reserved for secondary utilities co-located with the component (e.g. `resolveIcon` next to `Icon`).
- Use `type` (not `interface`) for props unless extending a third-party type.
- Centralize cross-cutting types in `src/utils/types.d.ts`.
- If a component exceeds ~150 lines, split it.

---

## TypeScript Rules (Strict)

`tsconfig.json` has `strict: true` and `noUncheckedIndexedAccess: true`. Enforced:

- **No `any`** — use `unknown` and narrow with type guards.
- **No `as X`** assertions unless interfacing with the DOM or unavoidable third-party interop (add a comment).
- **No `!` non-null assertions** — use `?.` and `??`.
- Prefer `type` over `interface` for component props, API shapes, and local types.
- Explicit return types are encouraged on exported functions and not required when obvious from context.
- Service functions **must** have typed parameters and return values:

```ts
// WRONG
export const getUser = (id: any): any => axios.get(`/users/${id}`);

// RIGHT
export const getUser = (id: string): Promise<AxiosResponse<User>> =>
  axios.get(`/users/${id}`);
```

---

## Path Aliases

Configured in `tsconfig.json`. Use these for all internal imports — never relative `../../`.

| Alias          | Maps to                  |
| -------------- | ------------------------ |
| `@/*`          | `src/*`                  |
| `@components/*`| `src/components/*`       |
| `@libs/*`      | `src/libs/*`             |
| `@services/*`  | `src/services/*`         |
| `@api/*`       | `src/services/*` (alias) |
| `@schemas/*`   | `src/schemas/*`          |
| `@hooks/*`     | `src/hooks/*`            |
| `@store/*`     | `src/store/*`            |
| `@utils/*`     | `src/utils/*`            |
| `@provider/*`  | `src/provider/*`         |

---

## Forms

Use **React Hook Form + Zod**:

1. Schema lives in `src/schemas/<domain>.ts`.
2. `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`.
3. Never use Formik for new forms.

```ts
// src/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 chars"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

---

## Data Fetching

Use **React Query v5** for all server state:

1. Query keys live in `src/hooks/queryKeys.ts` as a typed constant tree.
2. Feature hooks live in `src/hooks/use<Feature>.ts`.
3. **Never fetch directly inside a component body** — always via a hook.
4. Server state never goes in Redux.

```ts
// src/hooks/useAccounts.ts
import { useQuery } from "@tanstack/react-query";
import { fetchAccounts } from "@services/accounts";
import { queryKeys } from "@hooks/queryKeys";

export const useAccounts = () =>
  useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => (await fetchAccounts()).data.accounts,
  });
```

Mutations invalidate related queries on success — keep cache freshness centralized inside the hook, not the component.

---

## Services

- **One file per domain** in `src/services/` (`auth.ts`, `accounts.ts`, `transactions.ts`, `budgets.ts`, `goals.ts`, `dashboard.ts`).
- Functions are plain async wrappers around the axios instance from `@libs/axios`.
- **No business logic** in services — just HTTP calls with typed params and responses.
- Base URL is set in `@libs/axios` — never hardcode.
- Auth is attached by the request interceptor automatically.
- Service functions only need the endpoint path.

```ts
// src/services/accounts.ts
import axios from "@libs/axios";
import type { AxiosResponse } from "axios";
import type { BankAccount } from "@utils/types";

export const fetchAccounts = (): Promise<AxiosResponse<{ accounts: BankAccount[] }>> =>
  axios.get<{ accounts: BankAccount[] }>("/accounts");
```

---

## Error Handling

- Transport errors (401 → refresh + redirect, 5xx → toast) are handled globally by the axios interceptor in `@libs/axios`.
- **Don't `.catch()` inside service functions** — let the interceptor surface them.
- React Query exposes errors via `error`/`isError` — handle UI states (empty, retry) in the component or hook.
- Mutations use `onError` to give user feedback (toast).
- Only `try/catch` inside a service if you need to transform the error shape.

---

## State Management

- **Server state** → React Query (lists, details, mutations).
- **Global UI state** → Redux Toolkit slices in `src/store/slices/` (auth user, theme, sidebar state).
- **Local UI state** → `useState` / `useReducer`.
- Do not store server data in Redux.

---

## Pages (App Router)

Pages in `src/app/(auth)/` and `src/app/(protected)/` must be **thin**:

```tsx
// src/app/(protected)/dashboard/page.tsx
import DashboardView from "@components/blocks/dashboard/dashboardView";

const Page = () => <DashboardView />;

export default Page;
```

- Pages import a **single block view** from `@components/blocks/<feature>/<feature>View.tsx`.
- No JSX beyond the top-level wrapper and the imported view.
- Add `"use client"` only inside the block when needed (hooks, state, browser APIs). Pages stay server components by default.

### Not-found page

- `src/app/not-found.tsx` stays thin and renders `@components/common/NotFoundPage`.
- Style with Tailwind utilities — no module SCSS.

---

## Styling

1. **Tokens** live in `src/assets/scss/global.scss` as CSS variables and SCSS variables in `src/assets/scss/utils/`.
2. **Tailwind reads tokens** via `tailwind.config.ts` (`rgb(var(--c-x) / <alpha-value>)`). Never hardcode hex values in JSX.
3. **No inline `style={{}}`** — use Tailwind classes. Exception: a numeric/string value that comes from data (e.g. a user-picked account color, a computed progress bar width). Use Tailwind for anything fixed.
4. **No new `*.module.scss` files** — use Tailwind. Existing SCSS partials in `src/assets/scss/components/` (topbar, menubar, card, dashboard, auth) provide structural styles only.
5. Compose classes with `cn()` from `@utils/cn`.

### Typography

- Numbers → **Fraunces** (display serif) with `tabular-nums`. Use the `editorial-number` or `tabular` class.
- Body → **Inter**.
- Labels / eyebrows / metadata → **JetBrains Mono**, uppercase, letter-spaced.

---

## Money handling

Most important rule.

1. **Backend**: stored as Prisma `Decimal(14, 2)`. Never `Float`.
2. **Wire format**: number.
3. **Frontend**: every amount flows through `@utils/currency`:
   - `formatPKR(value)` — full PKR string with Pakistani lakh grouping (`1,50,000`).
   - `formatPKRCompact(value)` — chart labels (`1.5L`, `15L`, `1Cr`).
4. **Never** call `.toLocaleString`, `Intl.NumberFormat`, or `toFixed` directly on money.

---

## Auth flow

- Access token: 15min JWT. Refresh: 14-day JWT, stored hashed in Redis with `jti`.
- Refresh **rotates** — each successful refresh deletes the previous `jti` and issues a new one.
- Logout deletes every refresh key for the user.
- Axios interceptor auto-refreshes on first 401, retries the original request once, and falls back to `/login` if refresh fails.

---

## Naming Conventions

| Thing                    | Convention                       | Example                                |
| ------------------------ | -------------------------------- | -------------------------------------- |
| Component folders        | `PascalCase`                     | `ProfileDropdown/`                     |
| Component entry file     | `index.tsx`                      | `Button/index.tsx`                     |
| Block files              | `camelCase`                      | `dashboardView.tsx`, `authForm.tsx`    |
| Sub-component files      | `PascalCase`                     | `DropDownItem.tsx`                     |
| SCSS partial files       | `_kebab-case.scss`               | `_topbar.scss`, `_animations.scss`     |
| Hook files               | `camelCase` prefixed `use`       | `useAccounts.ts`, `useAuth.ts`         |
| Redux slice files        | `camelCase` suffixed `Slice`     | `authSlice.ts`, `uiSlice.ts`           |
| Provider files           | `PascalCase` suffixed `Provider` | `StoreProvider.tsx`, `QueryProvider.tsx` |
| Service files            | `camelCase` per domain           | `auth.ts`, `accounts.ts`               |
| Schema files             | `camelCase` per domain           | `auth.ts`, `transaction.ts`            |
| Utility / config files   | `kebab-case` (multi-word)        | `cookie-utils.ts`, `end-points.ts`     |
| Single-word util files   | `lowercase`                      | `cn.ts`, `currency.ts`                 |
| Type declaration files   | `.d.ts`                          | `types.d.ts`                           |
| Type / interface names   | `PascalCase`                     | `BankAccount`, `AuthState`             |

---

## Do Not

- Do **not** create components outside `src/components/` (new work).
- Do **not** use `any` in new code.
- Do **not** fetch data in page files or component bodies — always go through a hook.
- Do **not** add inline `style={{}}` — use Tailwind classes (exception: dynamic values from data).
- Do **not** create new `*.module.scss` files — use Tailwind.
- Do **not** commit `console.log` statements.
- Do **not** use `!` non-null assertions in new code.
- Do **not** import directly from `@components/blocks/...` in pages — go through the feature view default export.

---

## AI Execution Constraints

- Do **not** run `npm run build` unless explicitly asked for a production build.
- Once a file has been read, treat it as **cached context** — don't re-read unless it has changed or re-validation is required.
- Avoid reading more than 5–7 files before taking action.
- Prefer this document as the source of truth instead of re-reading files.
- If sufficient context is available, proceed to implementation immediately.

### Decision rules

Before reading a new file, ask:

1. Can the task be completed with already-read files?
2. Is this file directly related to the feature?

If yes → proceed. If no → stop reading.

### Trust assumptions

- Assume imports are correct unless an error is shown.
- Assume folder structure matches this document.
- Do **not** re-verify styling files unless a styling issue is reported.

---

## Key Entry Points

**Auth flow**
- `src/app/(auth)/login/page.tsx`
- `src/components/blocks/auth/loginView.tsx`
- `src/components/blocks/forms/authForm.tsx`
- `src/store/slices/authSlice.ts`
- `src/schemas/auth.ts`
- `src/services/auth.ts`

**Layout system**
- `src/app/layout.tsx` (root)
- `src/app/(protected)/layout.tsx` (auth shell)
- `src/components/layout/Topbar/`
- `src/components/layout/Menubar/`

**Not-found**
- `src/app/not-found.tsx`
- `src/components/common/NotFoundPage/`

**Providers**
- `src/provider/index.tsx` (composes Store + Query + Theme + Toaster)
- `src/provider/StoreProvider.tsx`
- `src/provider/QueryProvider.tsx`

**API layer**
- `src/services/*.ts` (one per domain)
- `src/libs/axios.ts` (instance, interceptors, token store)

**Data hooks**
- `src/hooks/queryKeys.ts` (centralized query keys)
- `src/hooks/useDashboard.ts`, `useAccounts.ts`, `useTransactions.ts`, `useBudgets.ts`, `useGoals.ts`

---

## Permissions

Update this file in the same PR whenever you:

- Add or rename a path alias.
- Add a new feature folder under `services/`, `hooks/`, `schemas/`, or `components/blocks/`.
- Change a global convention (e.g. the form library, the state library).
- Introduce a new global dependency.

Treat `RULES.md` as the contract — code reviewers can reject a PR that violates these rules.
