// This file runs entirely inside a Web Worker — no DOM access.

import type { Interval, WorkerInMessage, WorkerOutMessage } from './types';

let intervals: Interval[] = [];
let currentIndex = 0;
let intervalElapsed = 0; // seconds elapsed in current interval
let sessionElapsed = 0; // seconds elapsed in total session
let lastTimestamp = 0; // performance.now() at last tick
let running = false;
let tickInterval: ReturnType<typeof setInterval> | null = null;

const TICK_RATE_MS = 250; // Tick 4x per second for responsive UI

function send(message: WorkerOutMessage) {
  self.postMessage(message);
}

function tick() {
  if (!running) return;

  const now = performance.now();
  const delta = (now - lastTimestamp) / 1000; // Convert ms to seconds
  lastTimestamp = now;

  intervalElapsed += delta;
  sessionElapsed += delta;

  const current = intervals[currentIndex];

  // Check if the current interval has ended
  if (intervalElapsed >= current.duration) {
    const overflow = intervalElapsed - current.duration;
    currentIndex++;

    // Check if the session is complete
    if (currentIndex >= intervals.length) {
      running = false;
      if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      send({ type: 'complete' });
      return;
    }

    // Move to next interval, carrying over any overflow time
    intervalElapsed = overflow;
    send({ type: 'intervalChange', currentIndex, interval: intervals[currentIndex] });
  }

  // Send a regular tick for UI updates
  send({ type: 'tick', currentIndex, intervalElapsed, sessionElapsed });
}

self.addEventListener('message', (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'start':
      intervals = msg.intervals;
      currentIndex = 0;
      intervalElapsed = 0;
      sessionElapsed = 0;
      running = true;
      lastTimestamp = performance.now();

      if (tickInterval !== null) clearInterval(tickInterval);
      tickInterval = setInterval(tick, TICK_RATE_MS);

      // Fire the first interval change immediately
      send({ type: 'intervalChange', currentIndex: 0, interval: intervals[0] });
      break;

    case 'pause':
      running = false;
      if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      break;

    case 'resume':
      if (!running) {
        running = true;
        lastTimestamp = performance.now(); // Reset timestamp to avoid time-jump on resume
        tickInterval = setInterval(tick, TICK_RATE_MS);
      }
      break;

    case 'stop':
      running = false;
      if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      intervals = [];
      currentIndex = 0;
      intervalElapsed = 0;
      sessionElapsed = 0;
      break;
  }
});
