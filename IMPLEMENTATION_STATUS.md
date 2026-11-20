# SiteFlow Implementation Status

Last updated: 2026-10-30 (pending-items pass)

## Verified working

| Check | Result |
|-------|--------|
| Docker Postgres on port **5434** | Healthy |
| Prisma migrations (incl. `device_push_tokens`) | Applied |
| Seed (4 sites, roles, finance, progress) | OK |
| Unit tests (`finance-calc`, `access`, `access.idor`) | **16 passed** |
| API health `/api/v1/health` | OK |
| Android preview APK via EAS | Built (LAN API URL) |
| Mobile org register + team invite API | Smoke-tested |

## Completed modules

### Backend (`apps/api`)
- Auth (Argon2id, access/refresh rotation, forgot/reset/change password)
- **SMTP mail service** (console fallback when `SMTP_HOST` unset; `devResetToken` in non-prod)
- Organization tenancy + site membership authorization
- **Organizations** GET/PATCH `/organizations/me`
- **Clients** and **Vendors** CRUD APIs
- Sites CRUD + archive (history retained)
- Income + void + audit; Expenses + partial payments + void
- Contacts, progress (with `previousSnapshot` edit history), uploads
- **Storage:** local + **S3/MinIO** path with signed URLs (`STORAGE_PROVIDER=s3`)
- Dashboard server-side aggregates
- Reports: site-wise, monthly income/expense, yearly, ledger, outstanding clients/vendors, **expense-categories**, **site-comparison**, **profitability**, Excel/PDF export
- Activity + **audit list** (`GET /activity/audit`) + notifications
- **Device push token registration** (`POST /devices/push-token`)
- Swagger at `/api/docs`

### Shared / Admin / Mobile
- Shared enums, Zod, INR paise math, IST dates
- Admin: dashboard, sites, transactions, contacts, progress, reports, team, notifications, activity+audit, org settings
- Mobile: Expo screens + SecureStore auth + **editable API URL override** + reset-password screen + push token registration hook

### Infra / docs
- `docker-compose.yml` (Postgres + MinIO), `.env.example`, README, `docs/DEPLOYMENT.md`, Dockerfiles

## Still optional / external credentials

- [ ] Configure real SMTP (`SMTP_*`) for production password-reset email
- [ ] Enable `STORAGE_PROVIDER=s3` + MinIO/AWS credentials in target env
- [ ] Expo FCM/APNs credentials for actual push delivery (device tokens can already be stored)
- [ ] Rebuild APK after large native changes; for IP changes use in-app **Settings → API URL** (no rebuild)
- [ ] Broader HTTP E2E / Playwright suites (unit IDOR coverage added)

## Dev credentials (never production)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@siteflow.local | SiteFlow@Admin123 |
| Partner | partner@siteflow.local | SiteFlow@Partner123 |
| Manager | manager@siteflow.local | SiteFlow@Manager123 |
| Viewer | viewer@siteflow.local | SiteFlow@Viewer123 |

API: `http://localhost:3001/api/v1` · Swagger: `http://localhost:3001/api/docs` · Admin: `http://localhost:3000`
