export type IntervalType = 'run' | 'rest';

export interface Interval {
	type: IntervalType;
	duration: number; // seconds
}

export interface SessionConfig {
	sessionDuration: number; // seconds — total session length
	minInterval: number; // seconds — shortest any interval can be
	maxInterval: number; // seconds — longest any interval can be
}

export interface SessionSummary {
	totalDuration: number; // seconds
	intervalsCompleted: number;
	totalRunTime: number; // seconds
	totalRestTime: number; // seconds
	avgRunInterval: number; // seconds
	avgRestInterval: number; // seconds
	runIntervalCount: number;
	restIntervalCount: number;
}

// Messages sent FROM the worker TO the main thread
export type WorkerOutMessage =
	| { type: 'tick'; currentIndex: number; intervalElapsed: number; sessionElapsed: number }
	| { type: 'intervalChange'; currentIndex: number; interval: Interval }
	| { type: 'complete' };

// Messages sent FROM the main thread TO the worker
export type WorkerInMessage =
	| { type: 'start'; intervals: Interval[] }
	| { type: 'pause' }
	| { type: 'resume' }
	| { type: 'stop' };
