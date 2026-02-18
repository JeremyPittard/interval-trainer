import type { SessionConfig } from './types';

class ConfigStore {
  config = $state<SessionConfig>({
    sessionDuration: 20 * 60, // 20 minutes default
    minInterval: 20, // 20 seconds default
    maxInterval: 90, // 90 seconds default
  });
}

export const configStore = new ConfigStore();
