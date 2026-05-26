# German Cards (Expo)

Vocabulary drill app focused on German cards, with swipe grading, input checking, and translation speaker support.

## Run locally

```bash
npm install
npx expo start
```

## Reliable mobile refresh (Expo Go)

If Expo Go shows stale code on phone while web has the newest code, use:

```bash
npm run start:mobile:fresh
```

This script:
- stops running `expo start` node processes
- clears `.expo`, `.expo-shared`, and Metro cache in `node_modules/.cache/metro`
- starts Expo with `--tunnel --clear`

If your device still shows stale content, clear Expo Go app storage once:
- Android: Settings -> Apps -> Expo Go -> Storage -> Clear cache (and Clear storage if needed)
- iOS: uninstall and reinstall Expo Go

## Environment variables

This app uses Expo public env variables at runtime:

- `EXPO_PUBLIC_GC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET`
- `EXPO_PUBLIC_GC_GOOGLE_API_KEY` (optional fallback, recommended)

For local development, create `.env.local` (git-ignored), for example:

```dotenv
EXPO_PUBLIC_GC_GOOGLE_CLIENT_ID=${GC_GOOGLE_CLIENT_ID}
EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET=${GC_GOOGLE_CLIENT_SECRET}
# Optional:
# EXPO_PUBLIC_GC_GOOGLE_API_KEY=${GC_GOOGLE_API_KEY}
```

## EAS build/deploy env setup

For remote EAS builds, add these variables in your EAS project environment so `.env` expansion works in cloud builds:

- `GC_GOOGLE_CLIENT_ID`
- `GC_GOOGLE_CLIENT_SECRET`

Then build:

```bash
eas build --platform android
```

## Quality checks

```bash
npm run lint
npm run test
```
