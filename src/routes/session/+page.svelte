<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { timerStore } from '$lib/timerStore.svelte';
  import { playRunCue, playRestCue, playCompleteCue } from '$lib/audio';
  import { formatDuration } from '$lib/formatTime';

  // Redirect to home if session hasn't been started
  if (timerStore.status === 'idle') {
    goto('/');
  }

  // Wake Lock — keeps the screen on during the session
  let wakeLock: WakeLockSentinel | null = null;

  async function acquireWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        console.warn('Wake lock failed:', e);
      }
    }
  }

  async function releaseWakeLock() {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  }

  // Re-acquire wake lock when page becomes visible again
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && timerStore.status === 'running') {
      acquireWakeLock();
    }
  }

  onMount(() => {
    if (document.visibilityState === 'visible') {
      acquireWakeLock();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onDestroy(() => {
    releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  // Play audio cues when the interval type changes
  let lastIntervalIndex = -1;
  $effect(() => {
    const idx = timerStore.currentIndex;
    const interval = timerStore.currentInterval;
    if (interval && idx !== lastIntervalIndex) {
      lastIntervalIndex = idx;
      if (interval.type === 'run') {
        playRunCue();
      } else {
        playRestCue();
      }
    }
  });

  // Navigate to summary when session completes
  $effect(() => {
    if (timerStore.status === 'complete') {
      playCompleteCue();
      releaseWakeLock();
      setTimeout(() => goto('/summary'), 1500);
    }
  });

  function handlePauseResume() {
    if (timerStore.status === 'running') {
      timerStore.pause();
      releaseWakeLock();
    } else if (timerStore.status === 'paused') {
      timerStore.resume();
      acquireWakeLock();
    }
  }

  function handleStop() {
    timerStore.stop();
    releaseWakeLock();
    goto('/');
  }

  // Colour coding for run vs rest
  const intervalColour = $derived(
    timerStore.currentInterval?.type === 'run' ? 'text-error-400' : 'text-success-400'
  );

  const progressPercent = $derived(Math.round(timerStore.sessionProgress * 100));
</script>

<div class="container mx-auto flex min-h-dvh max-w-lg flex-col items-center px-4 py-8">
  <!-- Current Interval Type -->
  <div class="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
    {#if timerStore.status === 'complete'}
      <p class="text-5xl font-black tracking-widest text-success-400">DONE!</p>
    {:else}
      <p class="text-xl font-semibold tracking-widest text-surface-400 uppercase">
        {timerStore.status === 'paused' ? 'PAUSED' : 'NOW'}
      </p>

      <p class="text-8xl font-black tracking-tight uppercase {intervalColour}">
        {timerStore.currentInterval?.type ?? '—'}
      </p>

      <!-- Interval Countdown -->
      <p class="font-mono text-6xl font-bold">
        {formatDuration(timerStore.intervalTimeRemaining)}
      </p>

      <!-- Next interval preview -->
      {#if timerStore.nextInterval}
        <p class="text-sm text-surface-400">
          Next: <span class="font-semibold capitalize">{timerStore.nextInterval.type}</span>
          ~{formatDuration(timerStore.nextInterval.duration)}
        </p>
      {/if}
    {/if}
  </div>

  <!-- Session Progress -->
  <div class="mb-8 w-full space-y-2">
    <div class="flex justify-between text-sm text-surface-400">
      <span>{formatDuration(timerStore.sessionElapsed)}</span>
      <span>{progressPercent}%</span>
      <span>{formatDuration(timerStore.sessionDuration)}</span>
    </div>
    <div class="h-3 overflow-hidden rounded-full bg-surface-700">
      <div
        class="h-full rounded-full bg-primary-500 transition-all duration-500"
        style="width: {progressPercent}%"
      ></div>
    </div>
  </div>

  <!-- Controls -->
  <div class="flex w-full gap-4 pb-8">
    <button class="btn flex-1 preset-filled-surface-200-800 py-4" onclick={handleStop}>
      Stop
    </button>
    <button
      class="btn flex-1 preset-filled-primary-500 py-4"
      onclick={handlePauseResume}
      disabled={timerStore.status === 'complete'}
    >
      {timerStore.status === 'running' ? 'Pause' : 'Resume'}
    </button>
  </div>
</div>
