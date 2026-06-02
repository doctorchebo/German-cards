export type CompletionFeedback = 'excellent' | 'bad' | null;

export function getCompletionFeedback(score: number): CompletionFeedback {
  if (score >= 90) return 'excellent';
  if (score < 50) return 'bad';
  return null;
}
