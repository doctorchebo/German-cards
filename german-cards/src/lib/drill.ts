import type { Card } from '@/src/types/card';

function shuffle<T>(items: T[]): T[] {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function chooseDrillCards(
  cards: Card[],
  size = 50,
  lastDrillCardIds: number[] = [],
  forcedCardIds: number[] = [],
  forcedCardKeys: string[] = []
): Card[] {
  if (cards.length === 0) return [];

  const targetSize = Math.min(size, cards.length);

  if (forcedCardKeys.length > 0) {
    const forcedKeySet = new Set(forcedCardKeys);
    const forcedCards = cards.filter((card) => card.key != null && forcedKeySet.has(card.key));
    return shuffle(forcedCards).slice(0, targetSize);
  }

  if (forcedCardIds.length > 0) {
    const forcedSet = new Set(forcedCardIds);
    const forcedCards = cards.filter((card) => forcedSet.has(card.id));
    return shuffle(forcedCards).slice(0, targetSize);
  }

  const recentSet = new Set(lastDrillCardIds);
  const freshPool = cards.filter((card) => !recentSet.has(card.id));
  const recentPool = cards.filter((card) => recentSet.has(card.id));

  const freshSelection = shuffle(freshPool).slice(0, targetSize);
  if (freshSelection.length === targetSize) {
    return freshSelection;
  }

  const needed = targetSize - freshSelection.length;
  const fallbackSelection = shuffle(recentPool).slice(0, needed);
  return [...freshSelection, ...fallbackSelection];
}

