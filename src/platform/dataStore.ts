import { BRAND } from '../config/brand';

/**
 * Persistence boundary. The prototype keeps data in localStorage and syncs
 * open tabs in real time through the browser's `storage` event, so a sponsor
 * tab and a student tab see each other's actions instantly.
 *
 * To go live, implement this interface with Supabase or Firebase:
 *   load   → select a row / document
 *   save   → upsert it
 *   subscribe → a realtime channel on the same key
 * Nothing else in the app needs to change.
 */
export interface DataStore {
  load<T>(key: string): T | null;
  save<T>(key: string, value: T | null): void;
  subscribe<T>(key: string, onChange: (value: T | null) => void): () => void;
}

const fullKey = (key: string) => `${BRAND.storagePrefix}:${key}`;

export const localDataStore: DataStore = {
  load<T>(key: string) {
    try {
      const raw = window.localStorage.getItem(fullKey(key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  save<T>(key: string, value: T | null) {
    try {
      if (value == null) window.localStorage.removeItem(fullKey(key));
      else window.localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch {
      /* storage unavailable — the tab still works in memory */
    }
  },
  subscribe<T>(key: string, onChange: (value: T | null) => void) {
    const k = fullKey(key);
    const handler = (e: StorageEvent) => {
      if (e.key !== k) return;
      try {
        onChange(e.newValue ? (JSON.parse(e.newValue) as T) : null);
      } catch {
        /* ignore malformed writes */
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};

/** Session is per tab, so one browser can be a student in one tab and a sponsor in another. */
export const sessionStore = {
  load<T>(key: string): T | null {
    try {
      const raw = window.sessionStorage.getItem(fullKey(key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  save<T>(key: string, value: T | null) {
    try {
      if (value == null) window.sessionStorage.removeItem(fullKey(key));
      else window.sessionStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

export const dataStore: DataStore = localDataStore;

export const KEYS = {
  student: 'student:v2',
  platform: 'platform:v1',
  session: 'session',
} as const;
