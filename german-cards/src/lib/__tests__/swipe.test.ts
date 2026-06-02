import { getSwipeDirection, SWIPE_THRESHOLD } from '@/src/lib/swipe';

describe('getSwipeDirection', () => {
  test('returns left for swipes at or past the negative threshold', () => {
    expect(getSwipeDirection(-SWIPE_THRESHOLD)).toBe('left');
    expect(getSwipeDirection(-SWIPE_THRESHOLD - 1)).toBe('left');
  });

  test('returns right for swipes at or past the positive threshold', () => {
    expect(getSwipeDirection(SWIPE_THRESHOLD)).toBe('right');
    expect(getSwipeDirection(SWIPE_THRESHOLD + 1)).toBe('right');
  });

  test('ignores movement below the swipe threshold', () => {
    expect(getSwipeDirection(-SWIPE_THRESHOLD + 1)).toBeNull();
    expect(getSwipeDirection(SWIPE_THRESHOLD - 1)).toBeNull();
    expect(getSwipeDirection(0)).toBeNull();
  });
});
