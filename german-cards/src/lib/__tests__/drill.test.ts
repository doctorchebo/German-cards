import { chooseDrillCards } from '@/src/lib/drill';
import { isAnswerCorrect } from '@/src/lib/text';
import type { Card } from '@/src/types/card';

function buildCards(count: number): Card[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    language: 'de',
    prompt: `word ${index + 1}`,
    answer: `answer ${index + 1}`,
  }));
}

describe('chooseDrillCards', () => {
  test('returns up to 50 cards', () => {
    const cards = buildCards(120);
    const selected = chooseDrillCards(cards, 50);
    expect(selected).toHaveLength(50);
  });

  test('prefers cards that were not in the previous drill when possible', () => {
    const cards = buildCards(60);
    const previousIds = Array.from({ length: 50 }, (_, index) => index + 1);
    const selected = chooseDrillCards(cards, 50, previousIds);
    const overlap = selected.filter((card) => previousIds.includes(card.id));
    expect(overlap).toHaveLength(40);
  });

  test('uses forced card ids for retry drills', () => {
    const cards = buildCards(30);
    const forcedIds = [3, 7, 21];
    const selected = chooseDrillCards(cards, 50, [], forcedIds);
    expect(selected.map((card) => card.id).sort((a, b) => a - b)).toEqual([3, 7, 21]);
  });
});

describe('isAnswerCorrect', () => {
  test('matches ignoring case and accents', () => {
    expect(isAnswerCorrect('there is/there are', 'There ARE')).toBe(true);
    expect(isAnswerCorrect('chewing gum', 'CHEWING   GUM')).toBe(true);
  });

  test('rejects wrong answers', () => {
    expect(isAnswerCorrect('between', 'before')).toBe(false);
  });
});

