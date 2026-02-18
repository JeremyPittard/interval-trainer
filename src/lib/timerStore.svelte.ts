import { generateIntervals } from './intervalGenerator';
import type { Interval, SessionConfig, WorkerOutMessage } from './types';
import TimerWorker from './timerWorker?worker';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'complete';

class TimerStore {
  // Svelte 5 runes — these are reactive state fields
  status = $state<SessionStatus>('idle');
  currentIndex = $state(0);
  intervalElapsed = $state(0);
  sessionElapsed = $state(0);
  intervals = $state<Interval[]>([]);

  // Derived values — automatically recomputed when dependencies change
  currentInterval = $derived(this.intervals[this.currentIndex] ?? null);

  sessionDuration = $derived(this.intervals.reduce((sum, i) => sum + i.duration, 0));

  sessionProgress = $derived(
    this.sessionDuration > 0 ? this.sessionElapsed / this.sessionDuration : 0
  );

  intervalTimeRemaining = $derived(
    this.currentInterval ? Math.max(0, this.currentInterval.duration - this.intervalElapsed) : 0
  );

  nextInterval = $derived(this.intervals[this.currentIndex + 1] ?? null);

  private worker: Worker | null = null;

  start(config: SessionConfig) {
    const generated = generateIntervals(config);
    this.intervals = generated;
    this.currentIndex = 0;
    this.intervalElapsed = 0;
    this.sessionElapsed = 0;
    this.status = 'running';

    this.worker = new TimerWorker();
    this.worker.addEventListener('message', this.handleMessage.bind(this));
    this.worker.postMessage({ type: 'start', intervals: generated });
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.worker?.postMessage({ type: 'pause' });
  }

  resume() {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.worker?.postMessage({ type: 'resume' });
  }

  stop() {
    this.worker?.postMessage({ type: 'stop' });
    this.terminateWorker();
    this.status = 'idle';
  }

  private terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private handleMessage(event: MessageEvent<WorkerOutMessage>) {
    const msg = event.data;

    switch (msg.type) {
      case 'tick':
        this.currentIndex = msg.currentIndex;
        this.intervalElapsed = msg.intervalElapsed;
        this.sessionElapsed = msg.sessionElapsed;
        break;

      case 'intervalChange':
        this.currentIndex = msg.currentIndex;
        // Audio cue will be triggered reactively in the component via $effect
        break;

      case 'complete':
        this.status = 'complete';
        this.terminateWorker();
        break;
    }
  }
}

// Export a single shared instance — all components share this state
export const timerStore = new TimerStore();
