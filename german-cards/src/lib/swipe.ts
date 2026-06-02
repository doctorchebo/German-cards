export type SwipeDirection = "left" | "right" | null;

export const SWIPE_THRESHOLD = 120;

export function getSwipeDirection(dx: number): SwipeDirection {
  if (dx <= -SWIPE_THRESHOLD) return "left";
  if (dx >= SWIPE_THRESHOLD) return "right";
  return null;
}
