import { get, getDatabase, push, ref, set, update } from 'firebase/database';

import { getCurrentUser, getFirebaseApp, waitForAuthReady } from '@/src/lib/firebase-auth';
import { seedCards } from '@/src/data/seed-cards';
import { chooseDrillCards } from '@/src/lib/drill';
import type { Card, DrillSession } from '@/src/types/card';

type TotalStats = {
  cardCount: number;
  drillsCompleted: number;
  rightAnswers: number;
  wrongAnswers: number;
};

type StoredCard = {
  language: 'de';
  prompt: string;
  answer: string;
  createdAt: number;
};

type StoredDrill = {
  startedAt: number;
  cardIds: number[];
};

type StoredAttempt = {
  drillId: string;
  cardId: number;
  result: 'right' | 'wrong';
  answeredWith: string | null;
  method: 'input' | 'swipe-left-know' | 'swipe-right-dont-know';
  createdAt: number;
};

type FlaggedCard = {
  cardKey: string;
  prompt: string;
  answer: string;
  flaggedAt: number;
};

let isReady = false;
let readyPromise: Promise<void> | null = null;
let sortedCardsCache: Card[] | null = null;
let flaggedKeysCache: Set<string> | null = null;

function sanitizeKey(input: string) {
  return input.trim().toLowerCase().replace(/[.#$\/[\]]/g, '_');
}

function makeCardKey(language: string, prompt: string, answer: string) {
  return `${sanitizeKey(language)}__${sanitizeKey(prompt)}__${sanitizeKey(answer)}`;
}

function makeTranslationKey(sourceText: string) {
  return sanitizeKey(sourceText);
}

function mapStoredCardsToSortedCards(cardsByKey: Record<string, StoredCard>): Card[] {
  const entries = Object.entries(cardsByKey);
  entries.sort((a, b) => a[1].prompt.localeCompare(b[1].prompt, 'de', { sensitivity: 'base' }));

  return entries.map(([key, entry], index) => ({
    id: index + 1,
    key,
    language: entry.language,
    prompt: entry.prompt,
    answer: entry.answer,
  }));
}

function cacheSortedCards(cardsByKey: Record<string, StoredCard>) {
  sortedCardsCache = mapStoredCardsToSortedCards(cardsByKey);
}

async function syncSeedCards() {
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const cardsRef = ref(db, 'cardsByKey');
  const snapshot = await get(cardsRef);
  const existing = snapshot.exists() ? (snapshot.val() as Record<string, StoredCard>) : {};

  const updates = seedCards.reduce<Record<string, StoredCard>>((acc, card) => {
    const key = makeCardKey(card.language, card.prompt, card.answer);
    if (!existing[key]) {
      acc[key] = {
        language: card.language,
        prompt: card.prompt,
        answer: card.answer,
        createdAt: Date.now(),
      };
    }
    return acc;
  }, {});

  const updateEntries = Object.entries(updates);
  if (updateEntries.length === 0) {
    cacheSortedCards(existing);
    return;
  }

  await update(cardsRef, updates);
  cacheSortedCards({ ...existing, ...updates });
}

export async function ensureDatabaseReady() {
  if (isReady) return;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    await waitForAuthReady();

    if (!getCurrentUser()) {
      throw new Error('Authentication required. Please sign in with Google.');
    }

    await syncSeedCards();
    isReady = true;
  })();

  try {
    await readyPromise;
  } finally {
    readyPromise = null;
  }
}

async function loadSortedCards(): Promise<Card[]> {
  await ensureDatabaseReady();
  if (sortedCardsCache) return sortedCardsCache;

  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'cardsByKey'));
  if (!snapshot.exists()) return [];

  cacheSortedCards(snapshot.val() as Record<string, StoredCard>);
  return sortedCardsCache ?? [];
}

export async function getAllCards(): Promise<Card[]> {
  await ensureDatabaseReady();
  return loadSortedCards();
}

export async function addCard(prompt: string, answer: string): Promise<void> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const cleanPrompt = prompt.trim();
  const cleanAnswer = answer.trim();
  if (!cleanPrompt || !cleanAnswer) return;

  const key = makeCardKey('de', cleanPrompt, cleanAnswer);
  await set(ref(db, `cardsByKey/${key}`), {
    language: 'de',
    prompt: cleanPrompt,
    answer: cleanAnswer,
    createdAt: Date.now(),
  } as StoredCard);
  sortedCardsCache = null;
}

async function getLastDrillCardIds(): Promise<number[]> {
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'meta/lastDrillCardIds'));

  if (!snapshot.exists()) return [];

  const cardIds = snapshot.val();
  return Array.isArray(cardIds) ? cardIds.filter((id) => typeof id === 'number') : [];
}

export async function createDrillSession(forcedCardIds: number[] = [], size = 50): Promise<DrillSession> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const isRetry = forcedCardIds.length > 0;

  const [cards, lastDrillCardIds] = await Promise.all([
    loadSortedCards(),
    isRetry ? Promise.resolve([]) : getLastDrillCardIds(),
  ]);
  const chosen = chooseDrillCards(cards, size, lastDrillCardIds, forcedCardIds);

  const drillRef = push(ref(db, 'drills'));
  if (!drillRef.key) {
    throw new Error('Failed to generate drill id.');
  }

  const drillPayload: StoredDrill = {
    startedAt: Date.now(),
    cardIds: chosen.map((card) => card.id),
  };

  if (isRetry) {
    update(ref(db), {
      [`drills/${drillRef.key}`]: drillPayload,
    }).catch(() => {});
  } else {
    await update(ref(db), {
      [`drills/${drillRef.key}`]: drillPayload,
      'meta/lastDrillCardIds': drillPayload.cardIds,
    });
  }

  return {
    drillId: drillRef.key,
    cards: chosen.map((card) => ({
      id: card.id,
      key: card.key ?? makeCardKey(card.language, card.prompt, card.answer),
      prompt: card.prompt,
      answer: card.answer,
    })),
  };
}

export async function recordAttempt(
  drillId: string,
  cardId: number,
  isRight: boolean,
  method: 'input' | 'swipe-left-know' | 'swipe-right-dont-know',
  answeredWith: string | null = null
) {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const payload: StoredAttempt = {
    drillId,
    cardId,
    result: isRight ? 'right' : 'wrong',
    answeredWith,
    method,
    createdAt: Date.now(),
  };

  await set(push(ref(db, 'attempts')), payload);
}

export async function getTotalStats(): Promise<TotalStats> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const [cardsSnapshot, drillsSnapshot, attemptsSnapshot] = await Promise.all([
    get(ref(db, 'cardsByKey')),
    get(ref(db, 'drills')),
    get(ref(db, 'attempts')),
  ]);

  const cardCount = cardsSnapshot.exists() ? Object.keys(cardsSnapshot.val() as Record<string, StoredCard>).length : 0;
  const drillsCompleted = drillsSnapshot.exists()
    ? Object.keys(drillsSnapshot.val() as Record<string, StoredDrill>).length
    : 0;

  let rightAnswers = 0;
  let wrongAnswers = 0;

  if (attemptsSnapshot.exists()) {
    const attempts = Object.values(attemptsSnapshot.val() as Record<string, StoredAttempt>);
    for (const attempt of attempts) {
      if (attempt.result === 'right') rightAnswers += 1;
      if (attempt.result === 'wrong') wrongAnswers += 1;
    }
  }

  return {
    cardCount,
    drillsCompleted,
    rightAnswers,
    wrongAnswers,
  };
}

export async function getCachedTranslation(sourceText: string): Promise<string | null> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const key = makeTranslationKey(sourceText);
  const snapshot = await get(ref(db, `translation_cache/${key}`));
  if (!snapshot.exists()) return null;

  const value = snapshot.val() as { translatedText?: string };
  return value.translatedText ?? null;
}

export async function saveCachedTranslation(sourceText: string, translatedText: string): Promise<void> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const key = makeTranslationKey(sourceText);
  await set(ref(db, `translation_cache/${key}`), {
    sourceText: sourceText.trim(),
    translatedText: translatedText.trim(),
    sourceLang: 'de',
    targetLang: 'en',
    createdAt: Date.now(),
  });
}

export async function updateCardByKey(cardKey: string, prompt: string, answer: string): Promise<void> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const cleanPrompt = prompt.trim();
  const cleanAnswer = answer.trim();
  if (!cleanPrompt || !cleanAnswer || !cardKey.trim()) return;

  const oldRef = ref(db, `cardsByKey/${cardKey}`);
  const oldSnapshot = await get(oldRef);
  if (!oldSnapshot.exists()) return;

  const oldCard = oldSnapshot.val() as StoredCard;
  const newKey = makeCardKey('de', cleanPrompt, cleanAnswer);
  const nextCard: StoredCard = {
    language: 'de',
    prompt: cleanPrompt,
    answer: cleanAnswer,
    createdAt: oldCard.createdAt ?? Date.now(),
  };

  await set(ref(db, `cardsByKey/${newKey}`), nextCard);
  if (newKey !== cardKey) {
    await set(oldRef, null);
    const flaggedRef = ref(db, `flaggedCardsByKey/${cardKey}`);
    const flaggedSnapshot = await get(flaggedRef);
    if (flaggedSnapshot.exists()) {
      await set(ref(db, `flaggedCardsByKey/${newKey}`), {
        cardKey: newKey,
        prompt: cleanPrompt,
        answer: cleanAnswer,
        flaggedAt: Date.now(),
      } as FlaggedCard);
      await set(flaggedRef, null);
    }
  } else {
    const flaggedRef = ref(db, `flaggedCardsByKey/${cardKey}`);
    const flaggedSnapshot = await get(flaggedRef);
    if (flaggedSnapshot.exists()) {
      await set(flaggedRef, {
        cardKey,
        prompt: cleanPrompt,
        answer: cleanAnswer,
        flaggedAt: Date.now(),
      } as FlaggedCard);
    }
  }
  sortedCardsCache = null;
}

export async function setCardFlag(cardKey: string, prompt: string, answer: string, flagged: boolean): Promise<void> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const targetRef = ref(db, `flaggedCardsByKey/${cardKey}`);

  if (!flagged) {
    await set(targetRef, null);
    if (flaggedKeysCache) flaggedKeysCache.delete(cardKey);
    return;
  }

  await set(targetRef, {
    cardKey,
    prompt: prompt.trim(),
    answer: answer.trim(),
    flaggedAt: Date.now(),
  } as FlaggedCard);
  if (flaggedKeysCache) flaggedKeysCache.add(cardKey);
}

export async function getFlaggedCardKeys(): Promise<Set<string>> {
  await ensureDatabaseReady();
  if (flaggedKeysCache) return new Set(flaggedKeysCache);

  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'flaggedCardsByKey'));
  if (!snapshot.exists()) {
    flaggedKeysCache = new Set<string>();
    return flaggedKeysCache;
  }

  flaggedKeysCache = new Set(Object.keys(snapshot.val() as Record<string, FlaggedCard>));
  return flaggedKeysCache;
}

export async function getFlaggedCards(): Promise<Card[]> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'flaggedCardsByKey'));
  if (!snapshot.exists()) return [];

  const entries = Object.entries(snapshot.val() as Record<string, FlaggedCard>);
  entries.sort((a, b) => (b[1].flaggedAt ?? 0) - (a[1].flaggedAt ?? 0));

  return entries.map(([key, entry], index) => ({
    id: index + 1,
    key,
    language: 'de',
    prompt: entry.prompt,
    answer: entry.answer,
  }));
}
