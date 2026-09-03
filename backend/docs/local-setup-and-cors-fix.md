# Local Setup — Redis, Postgres, and CORS Fix

This document captures everything that was done to get the FinanceFlow backend running locally on Windows and to fix the "CORS error on login" that the frontend was hitting.

---

## 1. Docker Desktop wasn't starting

### Symptom

```
docker info
> Error response from daemon: Docker Desktop is unable to start
```

### Root cause

WSL2 had **no installed Linux distributions**. Docker Desktop's default backend on Windows is WSL2 and it needs the WSL kernel + at least its own internal distros to boot. `wsl --list --verbose` confirmed it:

```
Windows Subsystem for Linux has no installed distributions.
```

### Fix

1. Updated the WSL kernel:

   ```powershell
   wsl --update
   ```

   (it was already at the latest — but this is the first thing to try)

2. Killed every Docker process and re-launched Docker Desktop:

   ```powershell
   Get-Process | Where-Object { $_.ProcessName -like "*docker*" } | Stop-Process -Force
   Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
   ```

3. Polled until the daemon came up — Docker Desktop installed its own internal `docker-desktop` WSL distro on this fresh start, and `docker info` started returning a server version.

---

## 2. Spinning up Redis + Postgres

The repo already has a [docker-compose.yml](../../docker-compose.yml) at the project root with `postgres` and `redis` services pre-configured. We only need those two for local dev (we run the backend and frontend on the host with `npm run dev`, not in Docker).

```powershell
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" up -d postgres redis
```

After the images downloaded (~70MB for postgres:16-alpine, smaller for redis:7-alpine) both came up healthy:

```
NAMES                  STATUS                   PORTS
financeflow-postgres   Up (healthy)             0.0.0.0:5432->5432/tcp
financeflow-redis      Up (healthy)             0.0.0.0:6379->6379/tcp
```

### Quick health-check commands

```powershell
docker exec financeflow-redis redis-cli ping        # -> PONG
docker exec financeflow-postgres pg_isready -U financeflow -d financeflow
# -> /var/run/postgresql:5432 - accepting connections
```

### Stop / start / remove later

```powershell
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" stop postgres redis
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" start postgres redis
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" down              # remove containers (volumes persist)
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" down -v           # wipe volumes too
```

---

## 3. The "CORS error on login" — actual root cause

### What looked like the problem

Frontend → `POST http://localhost:4000/api/auth/login` was failing with a CORS error in the browser console.

### What was really happening

Two other Next.js projects were already using the lower ports:

| Port | Process command line                                                         |
| ---- | ---------------------------------------------------------------------------- |
| 3000 | `D:\BestConnect\bestconnect-ui\node_modules\next\...start-server.js`         |
| 3001 | `D:\BestConnect\bestconnectadmin\bestconnect-admin-ui\node_modules\next\...` |
| 4000 | FinanceFlow backend (`tsx watch src/index.ts`)                               |

When FinanceFlow's frontend was started, Next.js saw 3000 and 3001 were taken and **auto-bumped to 3002** (or higher). But the backend's CORS config in [backend/src/app.ts](../src/app.ts) only allowed `http://localhost:3000`, so every request from `http://localhost:3002` was rejected at the preflight.

### Fix

Updated the CORS middleware in [backend/src/app.ts](../src/app.ts) to use a function-based origin check that, **in dev only**, allows any `http://localhost:<port>` origin. The explicit `CORS_ORIGIN` env list still applies in both dev and prod, so production stays strict.

```ts
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowedOrigins.includes(origin)) return cb(null, true); // explicit allowlist
      if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
```

### Verification

Preflight from origin `http://localhost:3002`:

```
HTTP 204
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
```

---

## 4. Database wasn't initialized

After CORS was fixed, login still returned `500`. The Postgres container was up, but the schema had never been pushed:

```
docker exec financeflow-postgres psql -U financeflow -d financeflow -c "\dt"
# -> Did not find any relations.
```

### Fix

From `backend/`:

```powershell
npx prisma db push --skip-generate
```

Then seed the demo data. The seed script doesn't load `.env` itself, so set the env vars inline for the run:

```powershell
$env:DATABASE_URL="postgresql://financeflow:financeflow@localhost:5432/financeflow"
$env:REDIS_URL="redis://localhost:6379"
npm run seed
```

Output:

```
✔  User: demo@financeflow.pk
✔  3 bank accounts
✔  20 transactions
✔  3 budgets
✔  2 goals + contributions
🚀  Seed complete.
```

> **Note:** if you want `npm run seed` to work without inline env vars in the future, add `import "dotenv/config";` to the top of [prisma/seed.ts](../prisma/seed.ts). Left as-is for now to avoid scope creep.

---

## 5. End-to-end login verification

```
POST http://localhost:4000/api/auth/login
Origin: http://localhost:3002
Body: { "email": "demo@financeflow.pk", "password": "demo123" }

-> HTTP 200
   user.email: demo@financeflow.pk
   accessToken: eyJhbGciOiJIUzI1NiIs...
   refreshToken: eyJhbGciOiJIUzI1NiIs...
   Access-Control-Allow-Origin: http://localhost:3002
```

Redis confirmed it stored the refresh token:

```
docker exec financeflow-redis redis-cli KEYS "refresh:*"
# -> refresh:cmp10d7ik0000g168ha41fw1u:97b1d680-6673-49a6-b8da-2fff5dd7ecef
#    refresh:cmp10d7ik0000g168ha41fw1u:56d7ec12-d9fd-4c65-afb5-d3822570a374
```

**Demo credentials**

- email: `demo@financeflow.pk`
- password: `demo123`

---

## 6. Heads-up — SQL Workbench won't work here

This project uses **PostgreSQL**, not MySQL. MySQL Workbench cannot connect to a Postgres server. Use one of these instead:

- **DBeaver** (free, multi-DB) — recommended
- **pgAdmin** (Postgres-specific)
- **Prisma Studio** (already in the repo): `npm run prisma:studio` from `backend/`

### Connection details

| Field    | Value         |
| -------- | ------------- |
| Host     | `localhost`   |
| Port     | `5432`        |
| Database | `financeflow` |
| User     | `financeflow` |
| Password | `financeflow` |

---

## 7. Daily startup checklist

After a reboot or a fresh terminal:

```powershell
# 1. Start Docker Desktop (GUI) and wait until the whale icon is steady
# 2. Bring up the stores
docker compose -f "d:\Practice\fainanceflow\docker-compose.yml" up -d postgres redis

# 3. Backend
cd d:\Practice\fainanceflow\backend
npm run dev

# 4. Frontend (in another terminal)
cd d:\Practice\fainanceflow\frontend
npm run dev
# Next.js will pick the first free port (3000, 3001, 3002, ...). Backend CORS
# now allows any localhost port in dev, so it doesn't matter which one it lands on.
```
