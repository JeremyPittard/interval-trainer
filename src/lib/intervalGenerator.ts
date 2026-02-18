import type { Interval, SessionConfig } from './types';

/**
 * Returns a random integer between min and max (inclusive).
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a sequence of alternating run/rest intervals that fills
 * the session duration as closely as possible without exceeding it.
 *
 * The sequence always starts with a 'run' interval.
 * The final interval is trimmed to fit exactly within the session duration.
 */
export function generateIntervals(config: SessionConfig): Interval[] {
  const { sessionDuration, minInterval, maxInterval } = config;
  const intervals: Interval[] = [];
  let elapsed = 0;
  let currentType: 'run' | 'rest' = 'run';

  while (elapsed < sessionDuration) {
    const remaining = sessionDuration - elapsed;

    // If remaining time is less than the minimum interval,
    // create one final interval to fill the gap exactly.
    if (remaining <= minInterval) {
      intervals.push({ type: currentType, duration: remaining });
      break;
    }

    // Generate a random duration, but clamp it so we don't exceed the session.
    const maxAllowed = Math.min(maxInterval, remaining);
    const duration = randomBetween(minInterval, maxAllowed);

    intervals.push({ type: currentType, duration });
    elapsed += duration;

    // Alternate between run and rest
    currentType = currentType === 'run' ? 'rest' : 'run';
  }

  return intervals;
}

/**
 * Estimates how many intervals a config will produce on average.
 * Useful for showing a preview on the config screen.
 */
export function estimateIntervalCount(config: SessionConfig): number {
  const avgInterval = (config.minInterval + config.maxInterval) / 2;
  return Math.round(config.sessionDuration / avgInterval);
}

/**
 * Validates a session config and returns an array of error messages.
 * An empty array means the config is valid.
 */
export function validateConfig(config: SessionConfig): string[] {
  const errors: string[] = [];

  if (config.sessionDuration < 60) {
    errors.push('Session duration must be at least 1 minute.');
  }
  if (config.minInterval < 10) {
    errors.push('Minimum interval must be at least 10 seconds.');
  }
  if (config.maxInterval < config.minInterval) {
    errors.push('Maximum interval must be greater than or equal to minimum interval.');
  }
  if (config.maxInterval > config.sessionDuration) {
    errors.push('Maximum interval cannot exceed the session duration.');
  }

  return errors;
}

/**
 * Computes post-session summary statistics from a completed interval sequence.
 */
export function computeSummary(
  intervals: Interval[],
  intervalsCompleted: number
): import('./types').SessionSummary {
  const completed = intervals.slice(0, intervalsCompleted);

  const runIntervals = completed.filter((i) => i.type === 'run');
  const restIntervals = completed.filter((i) => i.type === 'rest');

  const totalRunTime = runIntervals.reduce((sum, i) => sum + i.duration, 0);
  const totalRestTime = restIntervals.reduce((sum, i) => sum + i.duration, 0);

  return {
    totalDuration: totalRunTime + totalRestTime,
    intervalsCompleted,
    totalRunTime,
    totalRestTime,
    avgRunInterval: runIntervals.length > 0 ? Math.round(totalRunTime / runIntervals.length) : 0,
    avgRestInterval:
      restIntervals.length > 0 ? Math.round(totalRestTime / restIntervals.length) : 0,
    runIntervalCount: runIntervals.length,
    restIntervalCount: restIntervals.length,
  };
}
