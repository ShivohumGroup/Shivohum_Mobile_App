# SiteFlow Deployment Guide

## Components

1. PostgreSQL 16+
2. NestJS API
3. Next.js admin
4. Object storage (S3/MinIO) or local disk for small installs
5. Expo EAS builds for Android/iOS

## Environment

Copy `.env.example` and set strong values for:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ random chars)
- `CORS_ORIGINS` (exact admin origins)
- `STORAGE_*` / `S3_*` (`STORAGE_PROVIDER=local|s3`)
- `SMTP_*` (optional; without SMTP, password resets log to console / return `devResetToken` in non-prod)
- `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` (HTTPS in production)

### Object storage

```bash
# Local MinIO
docker compose up -d minio minio-init
# Then set STORAGE_PROVIDER=s3 and S3_* to MinIO values from .env.example
```

Uploads support short-lived signed URLs via `GET /api/v1/uploads/:id/signed-url`.

## Database

```bash
cd apps/api
npx prisma migrate deploy
# Create the first admin via a secure one-off script — do NOT reuse seed passwords
```

### Backups

```bash
pg_dump "$DATABASE_URL" -Fc -f siteflow-$(date +%Y%m%d).dump
# Restore:
# pg_restore -d "$DATABASE_URL" siteflow-YYYYMMDD.dump
```

Schedule daily backups and test restore quarterly.

## API

- Build: `npm run build -w @siteflow/api`
- Run: `node apps/api/dist/main.js`
- Health check: `GET /api/v1/health`
- Put TLS termination (nginx/Caddy/cloud LB) in front; never expose Postgres publicly.

## Admin

- Build: `npm run build -w @siteflow/admin`
- Set `NEXT_PUBLIC_API_URL` to the public HTTPS API URL.

## Mobile

- Configure `EXPO_PUBLIC_API_URL` per environment (dev LAN / staging / production).
- Use EAS Build for Android AAB and iOS IPA.
- Push notifications require Expo credentials + device tokens — infrastructure is prepared but not enabled until configured.

## Monitoring

- Watch API health endpoint
- Alert on 5xx rate and failed migrations
- Retain audit logs for financial void/correct operations
