# SiteFlow — Construction Site Manager

Production-oriented monorepo for managing multiple construction/interior sites: finances (INR), contacts, progress updates, team access, reports, mobile app, and web admin.

## Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo + React Native + TypeScript + Expo Router + Paper + TanStack Query |
| Admin | Next.js (App Router) + Tailwind + TanStack Query + Recharts |
| API | NestJS + Prisma + PostgreSQL + JWT (refresh rotation) + Swagger |
| Shared | `@siteflow/shared` — enums, Zod schemas, INR money + IST date helpers |
| Infra | Docker Compose (PostgreSQL + MinIO) |

## Quick start (local)

### 1. Prerequisites

- Node.js 20+
- Docker Desktop
- npm 10+

### 2. Start database

```bash
docker compose up -d postgres
# Optional object storage: docker compose up -d minio minio-init
```

Postgres is published on **host port 5434** (avoids conflicts with other local Postgres installs).

### 3. Install & migrate

```bash
npm install --legacy-peer-deps
npm run build:shared
cp .env.example .env
npm run db:generate
cd apps/api && npx prisma migrate dev --name init && npm run prisma:seed && cd ../..
```

### 4. Run services

```bash
# Terminal 1 — API (http://localhost:3001/api/v1, Swagger /api/docs)
npm run dev:api

# Terminal 2 — Admin (http://localhost:3000)
npm run dev:admin

# Terminal 3 — Mobile
npm run dev:mobile
```

For a physical Android device, set `EXPO_PUBLIC_API_URL` to your machine LAN IP, e.g. `http://192.168.1.10:3001/api/v1`.

## Development credentials (NEVER use in production)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@siteflow.local` | `SiteFlow@Admin123` |
| Partner | `partner@siteflow.local` | `SiteFlow@Partner123` |
| Site Manager | `manager@siteflow.local` | `SiteFlow@Manager123` |
| Viewer (Site A only) | `viewer@siteflow.local` | `SiteFlow@Viewer123` |

Seeded sites: Residential Project A, Commercial Project B, Residential Project C, Interior Project D.

## Monorepo layout

```
siteflow/
  apps/api        NestJS REST API
  apps/admin      Next.js admin panel
  apps/mobile     Expo mobile app
  packages/shared Shared types, money, dates, Zod
  infrastructure/
  docs/
  docker-compose.yml
```

## Financial rules (authoritative)

- Money stored as `Decimal(18,2)`; calculations use integer paise via `@siteflow/shared`.
- Client outstanding = `max(contract − confirmed receipts, 0)`; excess shown as overpayment.
- Unpaid expenses are **not** cash outflows; net cash = receipts − expense **payments**.
- Voided/rejected transactions are excluded from totals.
- Sites are isolated by organization + site membership authorization on every request.

## API

- Base: `/api/v1`
- Auth: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Health: `GET /health`
- Docs: `http://localhost:3001/api/docs`

## Tests

```bash
npm run test:api
```

## Production notes

See `docs/DEPLOYMENT.md` for hosting, HTTPS, backups, object storage, and Expo builds.

Do not commit real `.env` secrets. Rotate all JWT secrets and seed passwords before any production deployment.
