import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SYNC_FILE_NAME, SYNC_STORAGE_KEY } from '../lib/sync/constants';
import { getDeviceId } from '../lib/sync/key-store';

export type SyncStatus =
  | 'disconnected'
  | 'locked'
  | 'idle'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'rate-limited'
  | 'auth-error'
  | 'error';

export interface SyncConfig {
  enabled: boolean;
  gistId: string;
  fileName: string;
  githubLogin: string;
  deviceId: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  lastRemoteRevision: number | null;
  lastRemoteUpdatedAt: string | null;
}

export interface SyncState {
  config: SyncConfig;
  status: SyncStatus;
  keyReady: boolean;
  pendingChanges: boolean;
  lastError: string | null;
  lastErrorKind: string | null;
  setConfig: (patch: Partial<SyncConfig>) => void;
  setStatus: (status: SyncStatus) => void;
  setKeyReady: (ready: boolean) => void;
  markDirty: () => void;
  clearDirty: () => void;
  markSynced: (revision: number, updatedAt: string) => void;
  setError: (message: string | null, kind?: string | null) => void;
  resetConnection: () => void;
}

export function defaultSyncConfig(): SyncConfig {
  return {
    enabled: false,
    gistId: '',
    fileName: SYNC_FILE_NAME,
    githubLogin: '',
    deviceId: getDeviceId(),
    autoSync: true,
    lastSyncedAt: null,
    lastRemoteRevision: null,
    lastRemoteUpdatedAt: null,
  };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      config: defaultSyncConfig(),
      status: 'disconnected',
      keyReady: false,
      pendingChanges: false,
      lastError: null,
      lastErrorKind: null,

      setConfig: (patch) =>
        set((state) => ({ config: { ...state.config, ...patch } })),

      setStatus: (status) => set({ status }),

      setKeyReady: (keyReady) => set({ keyReady }),

      markDirty: () =>
        set((state) => ({
          pendingChanges: true,
          status: state.config.enabled ? 'pending' : state.status,
        })),

      clearDirty: () => set({ pendingChanges: false }),

      markSynced: (revision, updatedAt) =>
        set((state) => ({
          pendingChanges: false,
          status: 'synced',
          lastError: null,
          lastErrorKind: null,
          config: {
            ...state.config,
            lastSyncedAt: new Date().toISOString(),
            lastRemoteRevision: revision,
            lastRemoteUpdatedAt: updatedAt,
          },
        })),

      setError: (message, kind = null) =>
        set((state) => ({
          lastError: message,
          lastErrorKind: kind,
          status: message ? 'error' : state.status,
        })),

      resetConnection: () =>
        set({
          config: defaultSyncConfig(),
          status: 'disconnected',
          keyReady: false,
          pendingChanges: false,
          lastError: null,
          lastErrorKind: null,
        }),
    }),
    {
      name: SYNC_STORAGE_KEY,
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
