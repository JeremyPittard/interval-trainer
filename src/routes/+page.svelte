<script lang="ts">
  import { goto } from '$app/navigation';
  import { unlockAudio } from '$lib/audio';
  import { configStore } from '$lib/configStore.svelte';
  import { estimateIntervalCount, validateConfig } from '$lib/intervalGenerator';
  import { formatDurationLong } from '$lib/formatTime';
  import { timerStore } from '$lib/timerStore.svelte';
  import type { BeforeInstallPromptEvent } from '$lib/types';

  // Local reactive copies of the config values for the sliders
  let sessionMinutes = $state(Math.floor(configStore.config.sessionDuration / 60));
  let minIntervalSeconds = $state(configStore.config.minInterval);
  let maxIntervalSeconds = $state(configStore.config.maxInterval);

  // Sync local state back to config store
  $effect(() => {
    configStore.config = {
      sessionDuration: sessionMinutes * 60,
      minInterval: minIntervalSeconds,
      maxInterval: maxIntervalSeconds,
    };
  });

  // Derived validation and estimate
  const errors = $derived(validateConfig(configStore.config));
  const isValid = $derived(errors.length === 0);
  const estimatedIntervals = $derived(estimateIntervalCount(configStore.config));

  function handleStart() {
    if (!isValid) return;
    unlockAudio(); // Must happen in click handler to unlock AudioContext
    timerStore.start(configStore.config);
    goto('/session');
  }

  // PWA install prompt
  let installPromptEvent: BeforeInstallPromptEvent | null = $state(null);
  let showInstallBanner = $state(false);

  $effect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptEvent = e as BeforeInstallPromptEvent;
      showInstallBanner = true;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  });

  async function handleInstall() {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const result = await installPromptEvent.userChoice;
    if (result.outcome === 'accepted') {
      showInstallBanner = false;
    }
    installPromptEvent = null;
  }
</script>

<div class="container mx-auto max-w-lg px-4 py-12">
  <header class="mb-10 text-center">
    {#if showInstallBanner}
      <div class="preset-filled-primary-900 mb-6 flex items-center justify-between card p-4">
        <p class="text-sm">Add to your home screen for the best experience.</p>
        <div class="flex gap-2">
          <button class="btn preset-filled-primary-500 btn-sm" onclick={handleInstall}
            >Install</button
          >
          <button class="preset-ghost btn btn-sm" onclick={() => (showInstallBanner = false)}
            >✕</button
          >
        </div>
      </div>
    {/if}
    <h1 class="mb-2 h1">Pepper.</h1>
    <p class="text-surface-400">Configure your session then hit Start.</p>
  </header>

  <div class="space-y-8 card preset-filled-surface-100-900 p-6">
    <!-- Session Duration -->
    <div class="space-y-3">
      <div class="flex items-baseline justify-between">
        <label class="label font-semibold" for="session-duration">Session Duration</label>
        <span class="font-mono text-lg text-primary-400">{sessionMinutes} min</span>
      </div>
      <input
        id="session-duration"
        type="range"
        class="input"
        min="5"
        max="90"
        step="5"
        bind:value={sessionMinutes}
      />
      <div class="flex justify-between text-xs text-surface-400">
        <span>5 min</span>
        <span>90 min</span>
      </div>
    </div>

    <!-- Min Interval -->
    <div class="space-y-3">
      <div class="flex items-baseline justify-between">
        <label class="label font-semibold" for="min-interval">Min Interval</label>
        <span class="font-mono text-lg text-primary-400"
          >{formatDurationLong(minIntervalSeconds)}</span
        >
      </div>
      <input
        id="min-interval"
        type="range"
        class="input"
        min="10"
        max="300"
        step="5"
        bind:value={minIntervalSeconds}
      />
      <div class="flex justify-between text-xs text-surface-400">
        <span>10 sec</span>
        <span>5 min</span>
      </div>
    </div>

    <!-- Max Interval -->
    <div class="space-y-3">
      <div class="flex items-baseline justify-between">
        <label class="label font-semibold" for="max-interval">Max Interval</label>
        <span class="font-mono text-lg text-primary-400"
          >{formatDurationLong(maxIntervalSeconds)}</span
        >
      </div>
      <input
        id="max-interval"
        type="range"
        class="input"
        min="10"
        max="300"
        step="5"
        bind:value={maxIntervalSeconds}
      />
      <div class="flex justify-between text-xs text-surface-400">
        <span>10 sec</span>
        <span>5 min</span>
      </div>
    </div>

    <!-- Validation Errors -->
    {#if errors.length > 0}
      <div class="space-y-1 card preset-filled-error-500 p-4">
        {#each errors as error}
          <p class="text-sm">⚠ {error}</p>
        {/each}
      </div>
    {/if}

    <!-- Session Preview -->
    {#if isValid}
      <div class="card preset-filled-surface-200-800 p-4 text-center">
        <p class="text-sm text-surface-400">Estimated intervals</p>
        <p class="text-3xl font-bold">{estimatedIntervals}</p>
        <p class="mt-1 text-xs text-surface-400">
          alternating run / rest between {formatDurationLong(minIntervalSeconds)} and {formatDurationLong(
            maxIntervalSeconds
          )}
        </p>
      </div>
    {/if}

    <!-- Start Button -->
    <button
      class="btn w-full preset-filled-primary-500 py-4 text-lg"
      disabled={!isValid}
      onclick={handleStart}
    >
      Start Session
    </button>
  </div>
</div>
