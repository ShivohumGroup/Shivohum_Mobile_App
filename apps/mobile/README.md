# @siteflow/mobile

SiteFlow Construction Site Manager — Expo React Native app.

## Setup

```bash
# from monorepo root
npm install
npm run build:shared
npm run start -w @siteflow/mobile
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`.

- Simulator / emulator: `http://localhost:3001/api/v1` (Android emulator may need `http://10.0.2.2:3001/api/v1`)
- Physical device: `http://<your-lan-ip>:3001/api/v1`

Tokens are stored in **expo-secure-store** (not AsyncStorage).

## Stack

Expo SDK 52 · Expo Router · React Native Paper · TanStack Query · RHF + Zod · SecureStore · Image Picker · Notifications (infra only)
