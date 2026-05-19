import { get, getDatabase, push, ref, runTransaction, set } from 'firebase/database';

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
  drillId: number;
  cardId: number;
  result: 'right' | 'wrong';
  answeredWith: string | null;
  method: 'input' | 'swipe-left-know' | 'swipe-right-dont-know';
  createdAt: number;
};

let isReady = false;

function sanitizeKey(input: string) {
  return input.trim().toLowerCase().replace(/[.#$\/[\]]/g, '_');
}

function makeCardKey(language: string, prompt: string, answer: string) {
  return `${sanitizeKey(language)}__${sanitizeKey(prompt)}__${sanitizeKey(answer)}`;
}

function makeTranslationKey(sourceText: string) {
  return sanitizeKey(sourceText);
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
  if (updateEntries.length === 0) return;

  await Promise.all(updateEntries.map(([key, card]) => set(ref(db, `cardsByKey/${key}`), card)));
}

export async function ensureDatabaseReady() {
  if (isReady) return;

  await waitForAuthReady();

  if (!getCurrentUser()) {
    throw new Error('Authentication required. Please sign in with Google.');
  }

  await syncSeedCards();
  isReady = true;
}

async function loadSortedCards(): Promise<Card[]> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'cardsByKey'));
  if (!snapshot.exists()) return [];

  const entries = Object.values(snapshot.val() as Record<string, StoredCard>);
  entries.sort((a, b) => a.prompt.localeCompare(b.prompt, 'de', { sensitivity: 'base' }));

  return entries.map((entry, index) => ({
    id: index + 1,
    language: entry.language,
    prompt: entry.prompt,
    answer: entry.answer,
  }));
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
}

async function getLastDrillCardIds(): Promise<number[]> {
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const snapshot = await get(ref(db, 'drills'));

  if (!snapshot.exists()) return [];

  const drills = Object.values(snapshot.val() as Record<string, StoredDrill>);
  if (drills.length === 0) return [];

  let latest: StoredDrill | null = null;
  for (const drill of drills) {
    if (!latest || drill.startedAt > latest.startedAt) {
      latest = drill;
    }
  }

  return latest && Array.isArray(latest.cardIds) ? latest.cardIds : [];
}

async function getNextDrillId(): Promise<number> {
  const app = getFirebaseApp();
  const db = getDatabase(app);
  const counterRef = ref(db, 'meta/nextDrillId');
  const result = await runTransaction(counterRef, (current) => {
    if (typeof current === 'number' && Number.isFinite(current)) return current + 1;
    return 1;
  });

  if (!result.committed || typeof result.snapshot.val() !== 'number') {
    throw new Error('Failed to generate drill id.');
  }

  return result.snapshot.val() as number;
}

export async function createDrillSession(forcedCardIds: number[] = [], size = 50): Promise<DrillSession> {
  await ensureDatabaseReady();
  const app = getFirebaseApp();
  const db = getDatabase(app);

  const cards = await loadSortedCards();
  const lastDrillCardIds = forcedCardIds.length > 0 ? [] : await getLastDrillCardIds();
  const chosen = chooseDrillCards(cards, size, lastDrillCardIds, forcedCardIds);

  const drillId = await getNextDrillId();
  const drillPayload: StoredDrill = {
    startedAt: Date.now(),
    cardIds: chosen.map((card) => card.id),
  };

  await set(ref(db, `drills/${drillId}`), drillPayload);

  return {
    drillId,
    cards: chosen.map((card) => ({ id: card.id, prompt: card.prompt, answer: card.answer })),
  };
}

export async function recordAttempt(
  drillId: number,
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
