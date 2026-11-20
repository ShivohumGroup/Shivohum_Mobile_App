# SiteFlow — Setup Guide (fresh clone to running app)

This guide takes you from a fresh clone to running the API, the admin web app, and the mobile app on Windows, macOS, or Linux.

Repo: `https://github.com/ShivohumGroup/Shivohum_Mobile_App.git`

---

## 1. Install required software

| Software | Version | Why |
|---|---|---|
| Node.js | 20 or newer (LTS recommended) | Runs API, admin, mobile tooling |
| npm | 10 or newer (comes with Node) | Installs workspaces |
| Git | any recent | Clone the repo |
| Docker Desktop | latest | Runs PostgreSQL |
| Expo Go app (optional) | latest | Test mobile on a phone without building an APK |

Start Docker Desktop and wait until it says it is running before continuing.

---

## 2. Clone and install

```bash
git clone https://github.com/ShivohumGroup/Shivohum_Mobile_App.git
cd Shivohum_Mobile_App
npm install --legacy-peer-deps
npm run build:shared
```

- `npm install` installs dependencies for all apps (`apps/*`) and packages (`packages/*`).
- `npm run build:shared` compiles `@siteflow/shared`, which the API and mobile app both import. Run it again whenever you change `packages/shared`.

---

## 3. Create the environment files

Secret `.env` files are **not** stored in Git. Create them yourself.

### 3.1 API — `apps/api/.env`

Copy the root example and use it as the API config:

```bash
# Windows PowerShell
Copy-Item .env.example apps/api/.env

# macOS / Linux
cp .env.example apps/api/.env
```

The default values work for local development:

- `DATABASE_URL=postgresql://siteflow:siteflow_dev_password@127.0.0.1:5434/siteflow?schema=public`
- `PORT=3001`
- `CORS_ORIGINS` includes `http://localhost:3000` (admin) and `exp://127.0.0.1:8081` (Expo)

Before any real deployment, change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random strings (32+ characters).

### 3.2 Admin web — `apps/admin/.env.local`

```bash
# Windows PowerShell
Copy-Item apps/admin/.env.example apps/admin/.env.local

# macOS / Linux
cp apps/admin/.env.example apps/admin/.env.local
```

Default value: `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

### 3.3 Mobile app — `apps/mobile/.env`

Create `apps/mobile/.env` with the address the phone will use to reach the API:

| Where you test | Value for `EXPO_PUBLIC_API_URL` |
|---|---|
| Android emulator | `http://10.0.2.2:3001/api/v1` |
| Phone on the same Wi‑Fi as your PC | `http://<your-PC-LAN-IP>:3001/api/v1`, e.g. `http://192.168.1.10:3001/api/v1` |
| Phone on any network (public tunnel) | the `https://...trycloudflare.com/api/v1` URL from section 9 |

Find your PC's LAN IP with `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS/Linux) — look for the IPv4 address of your Wi‑Fi adapter.

The phone can also change the server URL at runtime: on the login screen, tap **Can't sign in? Set server URL**.

---

## 4. Start the database

```bash
docker compose up -d postgres
```

- PostgreSQL runs on host port **5434** (to avoid clashing with a local Postgres).
- Credentials: user `siteflow`, password `siteflow_dev_password`, database `siteflow`.
- Only start `postgres`. The MinIO (object storage) images may fail to download; they are optional.

Check it is running:

```bash
docker ps
```

---

## 5. Prepare the database

Run these from the repo root:

```bash
npm run db:generate          # generates the Prisma client
cd apps/api
npx prisma migrate deploy    # applies all migrations in apps/api/prisma/migrations
npm run prisma:seed          # creates demo organization, users, and sites
cd ../..
```

Use `migrate deploy` on a fresh clone. Do **not** use `migrate dev --name init`, because the migrations already exist.

If `db:generate` fails on Windows with `EPERM ... query_engine` ("operation not permitted"), stop the API first, then run it again.

---

## 6. Run the apps

Open three terminals in the repo root.

```bash
# Terminal 1 — API
npm run dev:api
#   http://localhost:3001/api/v1
#   Swagger docs: http://localhost:3001/api/docs

# Terminal 2 — Admin web
npm run dev:admin
#   http://localhost:3000

# Terminal 3 — Mobile (Expo)
npm run dev:mobile
#   Scan the QR code with Expo Go, or press "a" for an Android emulator
```

Check the API is alive: open `http://localhost:3001/api/v1/health` in a browser.

---

## 7. Log in

Seeded development accounts (**development only**):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@siteflow.local` | `SiteFlow@Admin123` |
| Partner | `partner@siteflow.local` | `SiteFlow@Partner123` |
| Site Manager | `manager@siteflow.local` | `SiteFlow@Manager123` |
| Viewer (Site A only) | `viewer@siteflow.local` | `SiteFlow@Viewer123` |

Use the admin login at `http://localhost:3000` and the same credentials in the mobile app.

---

## 8. Build an Android APK (optional)

The APK is built in the cloud by Expo (EAS). A free Expo account is enough.

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

- The `preview` profile in `apps/mobile/eas.json` produces an installable `.apk`.
- The API URL baked into the APK comes from `EXPO_PUBLIC_API_URL` in `eas.json` / `app.json`. Set it to a URL the phone can reach (for example, the public tunnel URL). Rebuild the APK whenever that URL changes.
- Download the APK from the link EAS prints, install it on the phone, and allow installs from unknown sources when Android asks.

---

## 9. Share with testers over the internet (free)

This uses a free Cloudflare quick tunnel. No account is needed, but the URL **changes every time the tunnel restarts**.

1. `tools/cloudflared.exe` is included in the repo. If it is missing, download `cloudflared-windows-amd64.exe` from the Cloudflare releases page on GitHub and save it as `tools/cloudflared.exe`.
2. With the API running, start the tunnel:

   ```bash
   tools\cloudflared.exe tunnel --url http://127.0.0.1:3001
   ```

3. Copy the printed `https://<random>.trycloudflare.com` URL.
4. Use it in one of two ways:
   - **Quick:** in the app, tap **Set server URL** on the login screen and enter `https://<random>.trycloudflare.com/api/v1`.
   - **Built into an APK:** update `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`, `apps/mobile/eas.json`, and `apps/mobile/app.json`, then rebuild the APK.

Keep the tunnel window open while testers use the app. If it closes, the URL stops working.

---

## 10. Common problems

| Problem | Fix |
|---|---|
| `Can't reach database` / Prisma P1001 | Docker Desktop is not running, or `docker compose up -d postgres` was not run. |
| Port 3001 or 3000 already in use | Stop the other process, or find it with `netstat -ano \| findstr :3001` and end it. |
| Mobile says "Network request failed" | The phone cannot reach the API. Check the URL, Wi‑Fi (same network), and that the PC firewall allows port 3001. |
| Old data or old code after changes | Restart `npm run dev:api`. Run `npm run build:shared` after shared changes. |
| `EPERM` on Prisma generate (Windows) | Stop the API, run `npm run db:generate` again. |
| Login works in admin but not on the phone | Check `EXPO_PUBLIC_API_URL` (section 3.3) and the server URL in the app. |
| Schedule tab shows an error after a fresh clone | The schedule table migration may be missing. Ask the team to add it before using the Schedule tab. |

---

## Quick reference

```bash
git clone https://github.com/ShivohumGroup/Shivohum_Mobile_App.git
cd Shivohum_Mobile_App
npm install --legacy-peer-deps
npm run build:shared
docker compose up -d postgres
npm run db:generate
cd apps/api && npx prisma migrate deploy && npm run prisma:seed && cd ../..
npm run dev:api        # terminal 1
npm run dev:admin      # terminal 2
npm run dev:mobile     # terminal 3
```

Secrets stay out of Git. Never commit `.env`, `.env.local`, or real credentials.
