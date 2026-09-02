# FinanceFlow — Next.js → Expo (React Native) Conversion Plan

**Source codebase:** `frontend/` (Next.js 14 App Router)  
**Backend:** Separate Node API (`backend/`, typically `http://localhost:4000/api`) — no Next.js API routes under `frontend/`.  
**Audit date:** 2026-05-15

---

## 1. Executive Summary

This is a **client-rendered finance dashboard** (“FinanceFlow”) with:

- **App Router** under `frontend/src/app/`
- **Redux Toolkit** (auth + UI) + **TanStack Query** (server/cache)
- **Axios** to a configurable REST API, **JWT access + refresh** in `localStorage`
- **Optional “local offline”** session flag (still `localStorage`) that bypasses cloud API for finance CRUD via a client-side engine/store
- **Tailwind CSS** (`globals.css` + extensive `tailwind.config.ts`) layered with **global SCSS** (`src/assets/scss/`)
- **Radix UI** primitives, **lucide-react**, **recharts**, **framer-motion**, **sonner**, **next-themes**
- **react-hook-form** + **zod** + **@hookform/resolvers**

There is **no `getServerSideProps` / `getStaticProps`** — all data is client-side (React Query + services).

---

## 2. Routes → Expo Router Screens

| Next.js route | Source file | RN screen (proposed) | Notes |
|---------------|-------------|----------------------|-------|
| `/` (redirect) | `src/app/page.tsx` | `app/index.tsx` → `Redirect` to `/dashboard` or tabs | Use `Redirect` from `expo-router` |
| `(auth)/login` | `src/app/(auth)/login/page.tsx` | `app/(auth)/login.tsx` | Auth stack group |
| `(auth)/register` | `src/app/(auth)/register/page.tsx` | `app/(auth)/register.tsx` | |
| `(protected)/dashboard` | `src/app/(protected)/dashboard/page.tsx` | `app/(protected)/dashboard.tsx` or `(tabs)/index` | |
| `(protected)/accounts` | `src/app/(protected)/accounts/page.tsx` | `app/(protected)/accounts.tsx` | |
| `(protected)/transactions` | `src/app/(protected)/transactions/page.tsx` | `app/(protected)/transactions.tsx` | |
| `(protected)/expenses` | `src/app/(protected)/expenses/page.tsx` | `app/(protected)/expenses.tsx` | |
| `(protected)/budget` | `src/app/(protected)/budget/page.tsx` | `app/(protected)/budget.tsx` | |
| `(protected)/goals` | `src/app/(protected)/goals/page.tsx` | `app/(protected)/goals.tsx` | |
| `(protected)/subscriptions` | `src/app/(protected)/subscriptions/page.tsx` | `app/(protected)/subscriptions.tsx` | |
| `(protected)/loans` | `src/app/(protected)/loans/page.tsx` | `app/(protected)/loans.tsx` | |
| `(protected)/reports` | `src/app/(protected)/reports/page.tsx` | `app/(protected)/reports.tsx` | |
| `(protected)/settings` | `src/app/(protected)/settings/page.tsx` | `app/(protected)/settings.tsx` | |
| `not-found` | `src/app/not-found.tsx` | `app/+not-found.tsx` | Expo Router convention |

**Layout groups:**

- `src/app/layout.tsx` → root `app/_layout.tsx` (fonts, providers, safe area)
- `src/app/(auth)/layout.tsx` → `app/(auth)/_layout.tsx` (auth stack)
- `src/app/(protected)/layout.tsx` → `app/(protected)/_layout.tsx` (drawer or tabs + header; mirror desktop Menubar + mobile bottom nav)

**Navigation patterns to replace:**

- `next/link` + `usePathname()` → `expo-router` `Link`, `usePathname()` / tabs `href`
- `useRouter()` from `next/navigation` → `expo-router` `useRouter()` (`router.replace`, etc.)
- `useRequireAuth()` → gate with redirect to `/login` using Expo Router

---

## 3. API & Data Fetching

| Pattern | Where | RN action |
|---------|-------|-----------|
| **TanStack Query** | `@provider/QueryProvider`, hooks (`useDashboard`, `useAccounts`, …) | Keep; wrap app in `QueryClientProvider` |
| **Axios instance** | `src/libs/axios.ts` | Keep; replace `NEXT_PUBLIC_API_URL` with `expo-constants` `extra`; replace `tokenStore` `localStorage` with **SecureStore** (tokens) |
| **Service modules** | `src/services/*.ts` (`auth`, `accounts`, `transactions`, `budgets`, `goals`, `dashboard`, `loans`, `subscriptions`) | Keep; ensure base URL + interceptors |
| **401 refresh + redirect** | `axios.ts` interceptor uses `window.location.href` | Use **event emitter / auth slice / router.replace** toward login — no `window` |
| **SSR / ISR** | None observed | N/A |

**Local/offline finance path:**

- `src/lib/finance-backend-mode.ts` — `shouldUseCloudFinance()` (currently SSR-guards with `typeof window`; remove for RN → always synchronous false until hydrated)
- `src/lib/finance-store/*` — client engine when not using cloud

**Migration / export:**

- `src/lib/migrate-local-to-api.ts`, `finance-api-mappers.ts`, `export-full-csv.ts` — port file/csv usage to RN equivalents (see Forms / Files)

---

## 4. Third-Party Libraries → React Native Mapping

| Web dependency | RN / Expo recommendation |
|----------------|---------------------------|
| `next`, `react-dom` | Remove; use `expo` + `react-native` |
| `next/navigation`, `next/link` | `expo-router` v3 |
| `@radix-ui/react-*` | Custom `Modal`, `BottomSheet` (`@gorhom/bottom-sheet`), `Pressable` menus — rebuild UX |
| `lucide-react` | `@expo/vector-icons`, `lucide-react-native`, or asset SVGs + `react-native-svg` |
| `recharts` | `victory-native`, `react-native-gifted-charts`, or `react-native-skia` charts |
| `framer-motion` | `react-native-reanimated` + `react-native-gesture-handler` |
| `sonner` | `toastify-react-native`, `burnt`, or `@backpackapp-io/react-native-toast` |
| `next-themes` | `nativewind` dark mode / `Appearance` API / small context mirroring themes |
| `tailwindcss`, SCSS | **NativeWind v4** + design tokens in `constants/` **or** `StyleSheet.create` from token values |
| `@tanstack/react-query` | Keep |
| `@reduxjs/toolkit`, `react-redux` | Keep |
| `axios` | Keep |
| `react-hook-form`, `@hookform/resolvers`, `zod` | Keep |
| `date-fns` | Keep |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Optional on RN if using NativeWind; else reduce to small style helpers |

**Dev parity:** `@tanstack/react-query-devtools` — optional; use Flipper/Reactotron or omit in production.

---

## 5. Authentication Flow

1. **Login/register** (`src/services/auth.ts`) → POST `/auth/login`, `/auth/register` → receives `accessToken`, `refreshToken`, `user`.
2. **Tokens** stored in `src/libs/axios.ts` `tokenStore` via **localStorage** keys `ff:accessToken`, `ff:refreshToken`.
3. **Hydration** (`src/hooks/useAuth.ts`): `useHydrateUser` — if `isLocalSession()` → dispatch offline user; else if access token → `me()` GET `/auth/me`; else anonymous.
4. **Protected routes:** `useRequireAuth()` redirects to `/login` when anonymous.
5. **Logout:** POST `/auth/logout`, clear tokens + local session, clear Query cache, navigate to login.
6. **Continue offline** (`useContinueOffline`): sets local session flag, seeds `LOCAL_OFFLINE_USER`, routes to `/dashboard`.

**RN changes:**

- Persist tokens with **`expo-secure-store`** (and optionally AsyncStorage mirror for UX only — prefer SecureStore for secrets).
- Local session flag → **AsyncStorage** or SecureStore keyed flag.
- Replace all `typeof window === "undefined"` guards with synchronous module init safe for RN, or hydrate after mount.

---

## 6. State Management

| Layer | Files | RN |
|-------|-------|-----|
| **Redux** | `src/store/index.ts`, `slices/authSlice.ts`, `slices/uiSlice.ts`, `provider/StoreProvider.tsx` | Keep structure |
| **Typed hooks** | `src/hooks/useTypedRedux.ts` | Keep |
| **Server cache** | TanStack Query + `src/hooks/queryKeys.ts` | Keep |

---

## 7. Styling Approach

| Source | Contents |
|--------|----------|
| `tailwind.config.ts` | Design tokens (Binance-inspired colors, typography, radius, shadows) |
| `src/app/globals.css` | Tailwind layers + semantic utilities (`bg-primary`, `text-emerald`, …) |
| `src/assets/scss/global.scss`, `app.scss`, `components/_*.scss`, `utils/_variables.scss`, … | Layout, menubar, topbar, cards, animations |

**Conversion:** Map CSS variables / Tailwind theme to `constants/theme.ts` (colors, spacing, radii), then **NativeWind** `className` **or** `StyleSheet.create`. No CSS Grid — flex layout. Shadows → `shadowColor` / `shadowOffset` / `elevation`.

**Fonts:** `next/font` (Inter, JetBrains Mono) → `expo-font` + `@expo-google-fonts/inter` + JetBrains or fallback system mono.

---

## 8. Forms & Validation

| Area | Files |
|------|--------|
| Schemas | `src/schemas/*.ts` (auth, account, budget, goal, loan, subscription, transaction, wallet) |
| Forms | `src/components/blocks/forms/*.tsx` (auth, account, budget, goal, loan, subscription, transaction, transfer, wallet, quick add, csv import) |

**RN:** `TextInput`, `KeyboardAvoidingView`, `ScrollView`, `Controller` from react-hook-form; zod resolvers unchanged.

**CSV import** (`csvImportModal.tsx`): uses **`<input type="file">`** and web file reading → replace with **`expo-document-picker`** + read file as string (or `expo-file-system`) and reuse parsing logic.

---

## 9. Images & Assets

- **No `next/image`** usage called out in inventory; project has **no `frontend/public/`** directory in repo snapshot.
- **Icons:** `lucide-react` across layout and blocks → RN icon strategy above.
- Any future images: **`expo-image`** with `contentFit="cover"`, `cachePolicy="memory-disk"`.

---

## 10. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Axios `baseURL` (default `http://localhost:4000/api`) |

**Expo:** use `app.config.ts` `extra.apiUrl` + `expo-constants`, or `EXPO_PUBLIC_API_URL` (Expo SDK 49+ env convention). **Android emulator:** `localhost` → `10.0.2.2`; **iOS simulator:** often `localhost` works; document per platform.

---

## 11. Web-Only APIs to Remove or Replace

| API | Files / usage | Action |
|-----|---------------|--------|
| `window`, `document` | `axios.ts` (redirect, storage), `local-session.ts`, `finance-backend-mode.ts` | Platform-agnostic storage + router |
| `localStorage` | Token + offline session | SecureStore / AsyncStorage |
| HTML `<input file>` | `csvImportModal.tsx` | Document picker |
| Radix dropdowns, popovers, tooltips | Many `components/common/*` | RN patterns |
| CSS animations in SCSS | Various | Reanimated |

---

## 12. File Inventory — Every Source File to Convert or Port Logic

### 12.1 App Router (`frontend/src/app/`)

- `layout.tsx`
- `page.tsx`
- `globals.css`
- `not-found.tsx`
- `(auth)/layout.tsx`
- `(auth)/login/page.tsx`
- `(auth)/register/page.tsx`
- `(protected)/layout.tsx`
- `(protected)/dashboard/page.tsx`
- `(protected)/accounts/page.tsx`
- `(protected)/transactions/page.tsx`
- `(protected)/expenses/page.tsx`
- `(protected)/budget/page.tsx`
- `(protected)/goals/page.tsx`
- `(protected)/subscriptions/page.tsx`
- `(protected)/loans/page.tsx`
- `(protected)/reports/page.tsx`
- `(protected)/settings/page.tsx`

### 12.2 Components — `src/components/`

**Blocks — dashboard / feature views**

- `blocks/dashboard/dashboardView.tsx`
- `blocks/accounts/accountsView.tsx`
- `blocks/transactions/transactionsView.tsx`
- `blocks/expenses/expensesView.tsx`
- `blocks/budget/budgetView.tsx`
- `blocks/goals/goalsView.tsx`
- `blocks/subscriptions/subscriptionsView.tsx`
- `blocks/loans/loansView.tsx`
- `blocks/reports/reportsView.tsx`
- `blocks/settings/settingsView.tsx`
- `blocks/auth/loginView.tsx`
- `blocks/auth/registerView.tsx`

**Blocks — charts**

- `blocks/charts/CategoryDonut.tsx`
- `blocks/charts/IncomeExpenseChart.tsx`
- `blocks/charts/Sparkline.tsx`

**Blocks — forms**

- `blocks/forms/accountForm.tsx`
- `blocks/forms/authForm.tsx`
- `blocks/forms/budgetForm.tsx`
- `blocks/forms/csvImportModal.tsx`
- `blocks/forms/goalForm.tsx`
- `blocks/forms/loanForm.tsx`
- `blocks/forms/quickAddModal.tsx`
- `blocks/forms/subscriptionForm.tsx`
- `blocks/forms/transactionForm.tsx`
- `blocks/forms/transferForm.tsx`
- `blocks/forms/walletEditForm.tsx`

**Layout**

- `layout/Menubar/index.tsx`
- `layout/Topbar/index.tsx`

**Common UI**

- `common/Button/index.tsx`
- `common/PageLayout/index.tsx`
- `common/WidgetDatePicker/index.tsx`
- `common/ThemeSwitch/index.tsx`
- `common/Table/index.tsx`
- `common/Drawer/index.tsx`
- `common/Badge/index.tsx`
- `common/Checkbox/index.tsx`
- `common/FallBackState/index.tsx`
- `common/ProfileDropdown/index.tsx`
- `common/Modal/index.tsx`
- `common/Select/index.tsx`
- `common/Input/index.tsx`
- `common/PeriodicFilters/index.tsx`
- `common/NotFoundPage/index.tsx`
- `common/Pagination/index.tsx`
- `common/DateRange/index.tsx`
- `common/DatePicker/index.tsx`
- `common/Search/index.tsx`
- `common/Breadcrumb/index.tsx`
- `common/Greetings/index.tsx`
- `common/Tooltip/index.tsx`
- `common/Flex/index.tsx`
- `common/LoadingOverlay/index.tsx`
- `common/Header/index.tsx`
- `common/BrandSwitcher/index.tsx`
- `common/BrandDetector/index.tsx`
- `common/BrandInitializer/index.tsx`
- `common/ThemeInitializer/index.tsx`
- `common/Icon/index.tsx`
- `common/CountUp/index.tsx`
- `common/Avatar/index.tsx`

**Providers**

- `providers/FinanceCloudMigration.tsx`

### 12.3 Hooks (`src/hooks/`)

- `useAuth.ts`
- `useTypedRedux.ts`
- `useDashboard.ts`
- `useTransactions.ts`
- `useAccounts.ts`
- `useBudgets.ts`
- `useGoals.ts`
- `useLoans.ts`
- `useSubscriptions.ts`
- `queryKeys.ts`

### 12.4 Lib / services / store / provider

- `lib/local-session.ts`
- `lib/finance-backend-mode.ts`
- `lib/migrate-local-to-api.ts`
- `lib/finance-api-mappers.ts`
- `lib/export-full-csv.ts`
- `lib/finance-store/index.ts`
- `lib/finance-store/engine.ts`
- `lib/finance-store/types.ts`
- `lib/finance-store/constants.ts`
- `libs/axios.ts`
- `services/auth.ts`
- `services/accounts.ts`
- `services/transactions.ts`
- `services/budgets.ts`
- `services/goals.ts`
- `services/dashboard.ts`
- `services/loans.ts`
- `services/subscriptions.ts`
- `store/index.ts`
- `store/slices/authSlice.ts`
- `store/slices/uiSlice.ts`
- `provider/index.tsx`
- `provider/StoreProvider.tsx`
- `provider/QueryProvider.tsx`

### 12.5 Schemas (`src/schemas/`)

- `auth.ts`, `account.ts`, `budget.ts`, `goal.ts`, `loan.ts`, `subscription.ts`, `transaction.ts`, `wallet.ts`

### 12.6 Utils (`src/utils/`)

- `types.ts`, `types.d.ts`
- `categories.ts`
- `date.ts`
- `currency.ts`
- `cn.ts`

### 12.7 Styles (`src/assets/scss/`)

- `global.scss`, `app.scss`
- `components/_auth.scss`, `_menubar.scss`, `_topbar.scss`, `_dashboard.scss`, `_card.scss`, `_layout.scss`
- `utils/_variables.scss`, `_mixins.scss`, `_animations.scss`

### 12.8 Config (reference for Expo setup)

- `frontend/package.json`
- `frontend/next.config.mjs`
- `frontend/tailwind.config.ts`
- `frontend/tsconfig.json`
- `frontend/.env.example`

---

## 13. Suggested `mobile-app/` Module Order (Steps 4–6)

1. **Foundation:** `constants/theme.ts`, axios + SecureStore token layer, `QueryProvider`, `StoreProvider`, theme context (replaces `next-themes` behavior).
2. **Primitives:** `Button`, `Input`, `Modal`, `Badge`, `Checkbox`, `Flex`, `FallBackState`, `LoadingOverlay`.
3. **Layout:** `Topbar`, tab / drawer shell mirroring `Menubar` + bottom nav from protected layout.
4. **Data hooks + services:** copy with path fixes; adjust `shouldUseCloudFinance` for RN.
5. **Feature views:** dashboard → accounts → transactions → … (reuse hooks).
6. **Charts last:** highest rewrite cost (recharts → native chart lib).
7. **Polish:** FlashList for long lists, `RefreshControl`, error boundaries, skeletons.

---

## 14. Third-Party Services & Mobile SDKs

| Service | In current web app | Mobile note |
|---------|-------------------|-------------|
| **Custom REST API** | Yes | Point `apiUrl` to deployed backend; handle TLS / cleartext on Android if needed |
| Stripe / Firebase / push | Not observed in `package.json` | None required unless backend adds them later |

---

## 15. Post-Conversion Checklist (Step 11 Audit)

- [ ] No `window` / `document` / `localStorage` in production paths
- [ ] All lists that can grow large use **FlashList** where appropriate
- [ ] Images use **expo-image** when introduced
- [ ] `expo-router` auth guard matches Redux + token hydration
- [ ] TypeScript passes (`tsc --noEmit`)
- [ ] Run: `npx expo start` (then `i` / `a` for simulators)

---

## 16. Next Execution Step

**Completed:** Step 1 — analysis + this plan.

**Step 2 (next):** From repo root:

```bash
npx create-expo-app@latest mobile-app --template blank-typescript
```

Then align **Expo SDK 51+**, install **expo-router** v3, **nativewind** v4 (if chosen), **@shopify/flash-list**, **expo-image**, **expo-secure-store**, **react-native-safe-area-context**, **react-native-screens**, **@tanstack/react-query**, **axios**, **react-redux** + **@reduxjs/toolkit**, **react-hook-form**, **zod**, **@hookform/resolvers**, **date-fns**, **react-native-svg**, chart library choice, toast library, reanimated + gesture-handler, document-picker for CSV.

---

*End of conversion plan.*
