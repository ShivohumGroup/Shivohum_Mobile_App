# SiteFlow TODO

## Done
- [x] Monorepo + Docker Postgres (host port 5434)
- [x] Prisma schema, migrations, seed
- [x] NestJS API: auth, sites, finance, contacts, progress, dashboard, reports
- [x] S3/MinIO storage path + signed URLs
- [x] SMTP mail module for password reset (console fallback)
- [x] Clients + Vendors APIs
- [x] Expense category / site comparison / profitability reports
- [x] Organization settings API + admin UI
- [x] Audit log list API + admin UI
- [x] Device push token registration API + mobile hook
- [x] Mobile API URL override (no rebuild on Wi‑Fi IP change)
- [x] Mobile reset-password screen
- [x] IDOR/cross-org unit tests (16 total tests passing)
- [x] Admin reports wired to real export endpoints

## Optional next (needs external credentials / ops)
- [ ] Production SMTP values
- [ ] Production S3 bucket credentials
- [ ] Expo push (FCM/APNs) credentials
- [ ] Production HTTPS API URL + new EAS APK/AAB for Play Store
- [ ] Full HTTP/e2e suite beyond unit tests
