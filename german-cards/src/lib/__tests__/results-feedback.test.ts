import { getCompletionFeedback } from '@/src/lib/results-feedback';

describe('getCompletionFeedback', () => {
  test('returns excellent for scores of 90 percent or more', () => {
    expect(getCompletionFeedback(90)).toBe('excellent');
    expect(getCompletionFeedback(100)).toBe('excellent');
  });

  test('returns bad for scores below 50 percent', () => {
    expect(getCompletionFeedback(49)).toBe('bad');
    expect(getCompletionFeedback(0)).toBe('bad');
  });

  test('returns no feedback for middle scores', () => {
    expect(getCompletionFeedback(50)).toBeNull();
    expect(getCompletionFeedback(89)).toBeNull();
  });
});
