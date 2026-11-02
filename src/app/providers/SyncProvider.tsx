import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSyncStore } from '../../stores/useSyncStore';
import { restoreRememberedKey, isApplyingRemoteData, syncNow } from '../../lib/sync/engine';

const AUTO_SYNC_DELAY_MS = 4_000;
const AUTO_SYNC_INTERVAL_MS = 5 * 60_000;

function canAutoSync() {
  const config = useSyncStore.getState().config;
  return config.enabled && config.autoSync;
}

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function shouldSyncOnFocus() {
  const { pendingChanges, config } = useSyncStore.getState();
  if (pendingChanges) return true;
  if (!config.lastSyncedAt) return true;
  return Date.now() - Date.parse(config.lastSyncedAt) > AUTO_SYNC_INTERVAL_MS;
}

/**
 * Keeps the optional encrypted cloud mirror in step with local edits. This
 * provider deliberately never blocks the UI: every automatic sync is
 * best-effort and status/errors are surfaced through the sync chip and card.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let timer: number | null = null;
    let initialTimer: number | null = null;
    let disposed = false;

    void restoreRememberedKey().then((ready) => {
      if (disposed) return;
      const state = useSyncStore.getState();
      if (state.config.enabled && state.status === 'disconnected') {
        state.setStatus(ready ? 'idle' : 'locked');
      }
    });

    const runAutoSync = () => {
      if (disposed || !canAutoSync() || !isOnline()) return;
      void syncNow();
    };

    const scheduleSync = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(runAutoSync, AUTO_SYNC_DELAY_MS);
    };

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.data === previous.data) return;
      if (isApplyingRemoteData()) return;
      if (!useSyncStore.getState().config.enabled) return;
      useSyncStore.getState().markDirty();
      scheduleSync();
    });

    const handleFocus = () => {
      if (!canAutoSync() || !isOnline() || !shouldSyncOnFocus()) return;
      runAutoSync();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleFocus();
    };

    const handleOnline = () => {
      if (!canAutoSync()) return;
      useSyncStore
        .getState()
        .setStatus(useSyncStore.getState().pendingChanges ? 'pending' : 'idle');
      runAutoSync();
    };

    const handleOffline = () => {
      if (!useSyncStore.getState().config.enabled) return;
      useSyncStore.getState().setStatus('offline');
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') runAutoSync();
    }, AUTO_SYNC_INTERVAL_MS);

    if (canAutoSync() && isOnline()) {
      initialTimer = window.setTimeout(runAutoSync, 600);
    }

    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      if (initialTimer) window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return children;
}
