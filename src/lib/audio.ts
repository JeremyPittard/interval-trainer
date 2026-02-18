let audioContext: AudioContext | null = null;

/**
 * Gets or creates the AudioContext.
 * MUST be called from a user gesture (button tap) the first time.
 * Subsequent calls can happen freely.
 */
function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  // Context can be suspended if the page was backgrounded
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Plays a tone with the given frequency, duration, and waveform type.
 * @param frequency Hz — pitch of the tone
 * @param duration  seconds — how long the tone plays
 * @param type      oscillator waveform: 'sine' | 'square' | 'triangle'
 * @param gain      volume 0.0–1.0
 */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.4
): void {
  try {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade out at the end to avoid a harsh click
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio failure should never crash the timer
    console.warn('Audio playback failed:', e);
  }
}

/**
 * Plays the "start running" cue — two ascending sharp beeps.
 */
export function playRunCue(): void {
  playTone(880, 0.15, 'square', 0.35);
  setTimeout(() => playTone(1100, 0.2, 'square', 0.35), 160);
}

/**
 * Plays the "rest" cue — one lower, softer tone.
 */
export function playRestCue(): void {
  playTone(440, 0.3, 'sine', 0.3);
}

/**
 * Plays the session complete cue — a short descending arpeggio.
 */
export function playCompleteCue(): void {
  playTone(880, 0.15, 'sine', 0.4);
  setTimeout(() => playTone(660, 0.15, 'sine', 0.4), 200);
  setTimeout(() => playTone(440, 0.4, 'sine', 0.4), 400);
}

/**
 * Call this from a user gesture (e.g. the Start button) to unlock the
 * AudioContext before the session begins. Silent — just warms up the context.
 */
export function unlockAudio(): void {
  getContext();
}
