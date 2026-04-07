import * as SQLite from 'expo-sqlite';

import { seedCards } from '@/src/data/seed-cards';
import { chooseDrillCards } from '@/src/lib/drill';
import type { Card, DrillSession } from '@/src/types/card';

type TotalStats = {
  cardCount: number;
  drillsCompleted: number;
  rightAnswers: number;
  wrongAnswers: number;
};

const db = SQLite.openDatabaseSync(':memory:');

let isReady = false;

function runMigrations() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT NOT NULL DEFAULT 'de',
      prompt TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drill_cards (
      drill_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      PRIMARY KEY (drill_id, card_id),
      FOREIGN KEY (drill_id) REFERENCES drills (id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drill_id INTEGER NOT NULL,
      card_id INTEGER NOT NULL,
      result TEXT NOT NULL CHECK(result IN ('right', 'wrong')),
      answered_with TEXT,
      method TEXT NOT NULL CHECK(method IN ('input', 'swipe-left-know', 'swipe-right-dont-know')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (drill_id) REFERENCES drills (id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS translation_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_text TEXT NOT NULL UNIQUE,
      translated_text TEXT NOT NULL,
      source_lang TEXT NOT NULL DEFAULT 'de',
      target_lang TEXT NOT NULL DEFAULT 'en',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedDefaultCardsIfEmpty() {
  const existing = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  if ((existing?.count ?? 0) > 0) return;

  for (const card of seedCards) {
    db.runSync('INSERT INTO cards (language, prompt, answer) VALUES (?, ?, ?)', [
      card.language,
      card.prompt,
      card.answer,
    ]);
  }
}

export async function ensureDatabaseReady() {
  if (isReady) return;
  runMigrations();
  seedDefaultCardsIfEmpty();
  isReady = true;
}

export async function getAllCards(): Promise<Card[]> {
  await ensureDatabaseReady();
  return db.getAllSync<Card>('SELECT id, language, prompt, answer FROM cards ORDER BY prompt COLLATE NOCASE');
}

export async function addCard(prompt: string, answer: string): Promise<void> {
  await ensureDatabaseReady();
  db.runSync('INSERT INTO cards (language, prompt, answer) VALUES (?, ?, ?)', ['de', prompt.trim(), answer.trim()]);
}

function getLastDrillCardIds(): number[] {
  const latest = db.getFirstSync<{ id: number }>('SELECT id FROM drills ORDER BY id DESC LIMIT 1');
  if (!latest) return [];
  const rows = db.getAllSync<{ card_id: number }>('SELECT card_id FROM drill_cards WHERE drill_id = ?', [
    latest.id,
  ]);
  return rows.map((row) => row.card_id);
}

export async function createDrillSession(forcedCardIds: number[] = [], size = 50): Promise<DrillSession> {
  await ensureDatabaseReady();
  const cards = await getAllCards();
  const lastDrillCardIds = forcedCardIds.length > 0 ? [] : getLastDrillCardIds();
  const chosen = chooseDrillCards(cards, size, lastDrillCardIds, forcedCardIds);

  const insert = db.runSync('INSERT INTO drills DEFAULT VALUES');
  const drillId = insert.lastInsertRowId as number;

  for (const card of chosen) {
    db.runSync('INSERT INTO drill_cards (drill_id, card_id) VALUES (?, ?)', [drillId, card.id]);
  }

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
  db.runSync('INSERT INTO attempts (drill_id, card_id, result, answered_with, method) VALUES (?, ?, ?, ?, ?)', [
    drillId,
    cardId,
    isRight ? 'right' : 'wrong',
    answeredWith,
    method,
  ]);
}

export async function getTotalStats(): Promise<TotalStats> {
  await ensureDatabaseReady();

  const cards = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  const drills = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM drills');
  const right = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM attempts WHERE result = 'right'");
  const wrong = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM attempts WHERE result = 'wrong'");

  return {
    cardCount: cards?.count ?? 0,
    drillsCompleted: drills?.count ?? 0,
    rightAnswers: right?.count ?? 0,
    wrongAnswers: wrong?.count ?? 0,
  };
}

export async function getCachedTranslation(sourceText: string): Promise<string | null> {
  await ensureDatabaseReady();
  const row = db.getFirstSync<{ translated_text: string }>(
    'SELECT translated_text FROM translation_cache WHERE source_text = ? LIMIT 1',
    [sourceText.trim()]
  );
  return row?.translated_text ?? null;
}

export async function saveCachedTranslation(sourceText: string, translatedText: string): Promise<void> {
  await ensureDatabaseReady();
  db.runSync(
    `
      INSERT INTO translation_cache (source_text, translated_text)
      VALUES (?, ?)
      ON CONFLICT(source_text) DO UPDATE SET translated_text = excluded.translated_text
    `,
    [sourceText.trim(), translatedText.trim()]
  );
}
