import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { createInitialData, SCHEMA_VERSION } from '../../data/initial-data';
import type { AppData } from '../../types';
import { appDataSchema } from './schemas';

export const STORAGE_KEY = 'interview-prep-os-data';

export const STORAGE_EVENT = 'interview-os:storage-event';

export type StorageIssue = {
  kind: 'read' | 'write' | 'corrupt';
  message: string;
};

export function notifyStorageIssue(issue: StorageIssue) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<StorageIssue>(STORAGE_EVENT, { detail: issue }));
}

/**
 * A defensive wrapper around localStorage. Browsers can throw on read/write
 * (private mode, quota, disabled storage), so every access is guarded and
 * surfaced as a non-blocking application notification.
 */
export function createSafePersistStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      try {
        const raw = window.localStorage.getItem(name);
        if (!raw) return null;
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        notifyStorageIssue({
          kind: 'read',
          message: 'Saved data could not be read. The app is starting from defaults.',
        });
        return null;
      }
    },
    setItem: (name: string, value: StorageValue<T>) => {
      try {
        window.localStorage.setItem(name, JSON.stringify(value));
      } catch {
        notifyStorageIssue({
          kind: 'write',
          message: 'Changes could not be saved. Local storage may be full or unavailable.',
        });
      }
    },
    removeItem: (name: string) => {
      try {
        window.localStorage.removeItem(name);
      } catch {
        notifyStorageIssue({
          kind: 'write',
          message: 'Local data could not be cleared from this browser.',
        });
      }
    },
  };
}

/**
 * Persisted data migration. Version 1 is the initial schema. When a future
 * release changes shapes, add a step here and keep older versions readable.
 */
export function migratePersistedState(persisted: unknown, version: number): { data: AppData } | null {
  if (!persisted || typeof persisted !== 'object') return null;
  const state = persisted as { data?: unknown };
  if (!state.data || typeof state.data !== 'object') return null;

  let candidate = state.data as Record<string, unknown>;
  if (version > SCHEMA_VERSION) {
    notifyStorageIssue({
      kind: 'read',
      message: 'Saved data was created by a newer version of the app and could not be migrated.',
    });
    return null;
  }

  // Fill any arrays or settings added in later versions without destroying
  // existing records. This keeps forward migrations lightweight and safe.
  const defaults = createInitialData();
  candidate = {
    ...defaults,
    ...candidate,
    settings: {
      ...defaults.settings,
      ...(typeof candidate.settings === 'object' && candidate.settings ? candidate.settings : {}),
    },
    dailyLogs:
      typeof candidate.dailyLogs === 'object' && candidate.dailyLogs ? candidate.dailyLogs : {},
  };

  const parsed = appDataSchema.safeParse(candidate);
  if (!parsed.success) {
    notifyStorageIssue({
      kind: 'corrupt',
      message: 'Saved data was corrupted or incompatible. Defaults were restored.',
    });
    return null;
  }

  return { data: parsed.data };
}

export function clearPersistedData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    notifyStorageIssue({ kind: 'write', message: 'Could not clear local data.' });
  }
}
