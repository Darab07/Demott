// A short buzz on add/remove. Android browsers support it; iPhone Safari has
// no vibration API, so this quietly does nothing there.
export function tapFeedback(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // some browsers throw when called outside a user gesture
  }
}
