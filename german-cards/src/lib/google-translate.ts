import { getCachedTranslation, saveCachedTranslation } from '@/src/db/sqlite';

type TokenResponse = {
  access_token: string;
};

const inFlight = new Map<string, Promise<string>>();

async function fetchAccessToken() {
  const clientId = process.env.EXPO_PUBLIC_GC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing EXPO_PUBLIC_GC_GOOGLE_CLIENT_ID or EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET.');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  }).toString();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

async function fetchTranslationWithApiKey(sourceText: string): Promise<string> {
  const apiKey =
    process.env.EXPO_PUBLIC_GC_GOOGLE_API_KEY ??
    process.env.EXPO_PUBLIC_GC_GOOGLE_CLIENT_SECRET ??
    '';
  if (!apiKey) {
    throw new Error('Missing Google API key.');
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: sourceText,
      source: 'de',
      target: 'en',
      format: 'text',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API-key translation failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    data?: {
      translations?: { translatedText?: string }[];
    };
  };

  const translated = payload.data?.translations?.[0]?.translatedText?.trim();
  if (!translated) {
    throw new Error('API-key translation returned an empty result.');
  }

  return translated;
}

async function fetchTranslationFromGoogle(sourceText: string): Promise<string> {
  try {
    const token = await fetchAccessToken();
    const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: sourceText,
        source: 'de',
        target: 'en',
        format: 'text',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OAuth translation failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as {
      data?: {
        translations?: { translatedText?: string }[];
      };
    };

    const translated = payload.data?.translations?.[0]?.translatedText?.trim();
    if (!translated) {
      throw new Error('OAuth translation returned an empty result.');
    }

    return translated;
  } catch {
    return fetchTranslationWithApiKey(sourceText);
  }
}

export async function translateGermanToEnglish(sourceText: string): Promise<string> {
  const key = sourceText.trim();
  if (!key) return '';

  const cached = await getCachedTranslation(key);
  if (cached) return cached;

  const current = inFlight.get(key);
  if (current) return current;

  const pending = (async () => {
    const translated = await fetchTranslationFromGoogle(key);
    await saveCachedTranslation(key, translated);
    return translated;
  })();

  inFlight.set(key, pending);

  try {
    return await pending;
  } finally {
    inFlight.delete(key);
  }
}
