# German Cards (Expo)

Vocabulary drill app focused on German cards, with swipe grading, input checking, and translation speaker support.

## Run locally

```bash
npm install
npx expo start
```

## Environment variables

This app uses Expo public env variables at runtime:

- `EXPO_PUBLIC_GC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET`
- `EXPO_PUBLIC_GC_GOOGLE_API_KEY` (optional fallback, recommended)

`.env` is configured to map from your local machine variables:

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
