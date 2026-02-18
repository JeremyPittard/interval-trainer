<script lang="ts">
  import { goto } from '$app/navigation';
  import { timerStore } from '$lib/timerStore.svelte';
  import { configStore } from '$lib/configStore.svelte';
  import { computeSummary } from '$lib/intervalGenerator';
  import { formatDurationLong } from '$lib/formatTime';

  // If user lands here with no completed session, redirect home
  if (timerStore.status !== 'complete' && timerStore.intervals.length === 0) {
    goto('/');
  }

  const summary = computeSummary(timerStore.intervals, timerStore.intervals.length);

  function handlePlayAgain() {
    goto('/');
  }
</script>

<div class="container mx-auto max-w-lg px-4 py-12">
  <header class="mb-8 text-center">
    <h1 class="mb-1 h2">Session Complete</h1>
    <p class="font-semibold text-success-400">Great work!</p>
  </header>

  <div class="mb-8 space-y-4 card preset-filled-surface-100-900 p-6">
    <div class="grid grid-cols-2 gap-4">
      <div class="card preset-filled-surface-200-800 p-4 text-center">
        <p class="mb-1 text-xs tracking-wider text-surface-400 uppercase">Total Time</p>
        <p class="text-2xl font-bold">{formatDurationLong(summary.totalDuration)}</p>
      </div>

      <div class="card preset-filled-surface-200-800 p-4 text-center">
        <p class="mb-1 text-xs tracking-wider text-surface-400 uppercase">Intervals</p>
        <p class="text-2xl font-bold">{summary.intervalsCompleted}</p>
      </div>

      <div class="preset-filled-error-900 card p-4 text-center">
        <p class="mb-1 text-xs tracking-wider text-error-300 uppercase">Run Time</p>
        <p class="text-2xl font-bold text-error-400">{formatDurationLong(summary.totalRunTime)}</p>
        <p class="mt-1 text-xs text-surface-400">
          {summary.runIntervalCount} intervals · avg {formatDurationLong(summary.avgRunInterval)}
        </p>
      </div>

      <div class="preset-filled-success-900 card p-4 text-center">
        <p class="mb-1 text-xs tracking-wider text-success-300 uppercase">Rest Time</p>
        <p class="text-2xl font-bold text-success-400">
          {formatDurationLong(summary.totalRestTime)}
        </p>
        <p class="mt-1 text-xs text-surface-400">
          {summary.restIntervalCount} intervals · avg {formatDurationLong(summary.avgRestInterval)}
        </p>
      </div>
    </div>

    <!-- Work ratio bar -->
    <div class="space-y-1">
      <p class="text-xs tracking-wider text-surface-400 uppercase">Run / Rest ratio</p>
      <div class="flex h-4 overflow-hidden rounded-full">
        <div
          class="bg-error-500"
          style="width: {Math.round((summary.totalRunTime / summary.totalDuration) * 100)}%"
        ></div>
        <div class="flex-1 bg-success-500"></div>
      </div>
      <div class="flex justify-between text-xs text-surface-400">
        <span>Run {Math.round((summary.totalRunTime / summary.totalDuration) * 100)}%</span>
        <span>Rest {Math.round((summary.totalRestTime / summary.totalDuration) * 100)}%</span>
      </div>
    </div>
  </div>

  <button class="btn w-full preset-filled-primary-500 py-4 text-lg" onclick={handlePlayAgain}>
    New Session
  </button>
</div>
