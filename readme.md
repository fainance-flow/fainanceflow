# FinanceFlow

FinanceFlow is a personal finance tracker for managing bank accounts, wallets,
transactions, budgets, savings goals, and dashboard reports. The project is a
full-stack TypeScript app with a Next.js web client, an Express API, PostgreSQL,
Redis, and an Expo mobile app.

The app is built around PKR-friendly finance flows: multiple accounts, category
based budgets, income and expense summaries, goal progress, and Decimal-backed
money storage in the database.

## Apps

| App | Path | Stack | Default URL |
| --- | --- | --- | --- |
| API | `backend/` | Express, Prisma, PostgreSQL, Redis | `http://localhost:4000/api` |
| Web | `frontend/` | Next.js, React, Tailwind, Redux Toolkit, TanStack Query | `http://localhost:3000` |
| Mobile | `mobile-app/` | Expo, Expo Router, React Native, Redux Toolkit, TanStack Query | Expo dev server |

## Features

- Email/password authentication with JWT access tokens and Redis-backed refresh tokens.
- Bank account and wallet tracking with automatic balance updates.
- Income, expense, and transfer transactions.
- Monthly category budgets with status tracking.
- Savings goals with contribution history and progress.
- Dashboard totals, recent transactions, expense breakdowns, and chart data.
- Web and mobile clients sharing the same API concepts.

## Requirements

- Node.js 20+
- npm
- Docker Desktop, for PostgreSQL and Redis

## Quick Start With Docker

From the project root:

```powershell
docker compose up --build
```

Then open:

- Web app: `http://localhost:3000`
- API health check: `http://localhost:4000/api/health`

The Docker setup starts PostgreSQL, Redis, the backend, and the frontend. The
backend container also pushes the Prisma schema and runs the seed script.

## Local Development

### 1. Start the data services

```powershell
docker compose up -d postgres redis
```

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://financeflow:financeflow@localhost:5432/financeflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Then run:

```powershell
cd backend
npm install
npx prisma db push --skip-generate
npm run dev
```

The API runs on `http://localhost:4000`.

### 3. Configure the web app

`frontend/.env.local` is optional. The default API URL is already
`http://localhost:4000/api`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Run the web app:

```powershell
cd frontend
npm install
npm run dev
```

The web app runs on `http://localhost:3000`.

### 4. Run the mobile app

```powershell
cd mobile-app
npm install
npm start
```

Optional API override:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

If you test on a physical device, replace `localhost` with your computer's LAN
IP address so the phone can reach the backend.

## Useful Scripts

Backend scripts are run from `backend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with `tsx watch`. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm run start` | Run the compiled API. |
| `npm run typecheck` | Type-check without emitting files. |
| `npm run prisma:generate` | Generate the Prisma client. |
| `npm run prisma:migrate` | Create and apply a local Prisma migration. |
| `npm run prisma:deploy` | Apply existing migrations. |
| `npm run prisma:studio` | Open Prisma Studio. |
| `npm run seed` | Seed demo data. |
| `npm run clear` | Clear database data. |

Frontend scripts are run from `frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Build the production web app. |
| `npm run start` | Start the production web app. |
| `npm run lint` | Run Next.js linting. |
| `npm run typecheck` | Type-check without emitting files. |

Mobile scripts are run from `mobile-app/`:

| Command | Description |
| --- | --- |
| `npm start` | Start Expo. |
| `npm run android` | Build/run on Android. |
| `npm run ios` | Build/run on iOS. |
| `npm run web` | Start Expo for web. |
| `npm run typecheck` | Type-check without emitting files. |

## API Overview

Base URL: `http://localhost:4000/api`

| Area | Routes |
| --- | --- |
| Health | `GET /health` |
| Auth | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| Accounts | `/accounts` |
| Transactions | `/transactions`, `/transactions/summary` |
| Budgets | `/budgets`, `/budgets/status` |
| Goals | `/goals`, `/goals/:id/contribute`, `/goals/progress` |
| Dashboard | `/dashboard/summary`, `/dashboard/chart-data` |
| Admin | `/admin` |

Most application routes require `Authorization: Bearer <accessToken>`.

## Database

The Prisma schema lives at `backend/prisma/schema.prisma`.

Main models:

- `User`
- `BankAccount`
- `Transaction`
- `Budget`
- `Goal`
- `GoalContribution`

Money values are stored as `Decimal(14, 2)` in PostgreSQL.

## Project Structure

```text
financeflow/
  backend/
    prisma/
      schema.prisma
      seed.ts
    src/
      app.ts
      index.ts
      lib/
      middleware/
      routes/
      utils/
  frontend/
    src/
      app/
      components/
      hooks/
      libs/
      provider/
      schemas/
      services/
      store/
      utils/
  mobile-app/
    app/
    components/
    constants/
    hooks/
    lib/
    provider/
    store/
  docker-compose.yml
```

## Troubleshooting

- If the API returns database errors, make sure PostgreSQL is running and run
  `npx prisma db push --skip-generate` from `backend/`.
- If login requests fail because of CORS, confirm the web app origin matches
  `CORS_ORIGIN`. In development the backend also allows other
  `http://localhost:<port>` origins.
- If refresh-token calls fail, confirm Redis is running with
  `docker exec financeflow-redis redis-cli ping`.
- If the mobile app cannot reach the API on a physical device, use your
  computer's LAN IP in `EXPO_PUBLIC_API_URL`.
