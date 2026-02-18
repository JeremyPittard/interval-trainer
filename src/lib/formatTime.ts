/**
 * Formats a duration in seconds as M:SS (e.g. 125 → "2:05")
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds as a human-readable string (e.g. 125 → "2 min 5 sec")
 */
export function formatDurationLong(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}
