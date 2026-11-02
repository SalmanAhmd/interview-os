import { appDataSchema } from '../storage/schemas';
import { SCHEMA_VERSION } from '../../data/initial-data';
import type { AppData } from '../../types';
import { nowISO, stableStringify } from '../utils';
import { useAppStore } from '../../stores/useAppStore';
import { useSyncStore, type SyncStatus } from '../../stores/useSyncStore';
import {
  SYNC_FILE_NAME,
  SYNC_MAX_ENCRYPTED_BYTES,
  SYNC_MIN_PASSPHRASE_LENGTH,
} from './constants';
import {
  createSalt,
  decryptSnapshot,
  deriveKey,
  encryptSnapshot,
  isSyncEnvelope,
  SyncCryptoError,
  type SyncEnvelope,
  type SyncPayload,
} from './crypto';
import {
  createGist,
  deleteGist,
  getGist,
  readGistFile,
  SyncApiError,
  updateGist,
  type Gist,
} from './gist';
import {
  clearKey,
  clearStoredToken,
  getDeviceId,
  getStoredToken,
  loadKey,
  saveKey,
  setStoredToken,
} from './key-store';
import { mergeAppData, unlinkMissingApplications } from './merge';

export type JoinMode = 'replace' | 'merge';

export interface SyncResult {
  ok: boolean;
  pushed: boolean;
  pulled: boolean;
  merged: boolean;
  revision?: number;
  message: string;
  error?: string;
}

interface RemoteSnapshot {
  gist: Gist;
  envelope: SyncEnvelope;
  data: AppData;
}

let memoryKey: CryptoKey | null = null;
let memorySalt: string | null = null;
let applyingRemoteData = false;
let activeSync: Promise<SyncResult> | null = null;

export function isApplyingRemoteData(): boolean {
  return applyingRemoteData;
}

function applyData(data: AppData) {
  applyingRemoteData = true;
  try {
    useAppStore.getState().applyRemoteData(data);
  } finally {
    applyingRemoteData = false;
  }
}

function setMemoryKey(key: CryptoKey, salt: string) {
  memoryKey = key;
  memorySalt = salt;
  useSyncStore.getState().setKeyReady(true);
}

function clearMemoryKey() {
  memoryKey = null;
  memorySalt = null;
  useSyncStore.getState().setKeyReady(false);
}

function requireToken(): string {
  const token = getStoredToken();
  if (!token) {
    throw new Error('Add a GitHub token to use sync.');
  }
  return token;
}

function requireConfig() {
  const { config } = useSyncStore.getState();
  if (!config.enabled || !config.gistId) {
    throw new Error('Sync is not connected yet.');
  }
  return config;
}

async function ensureKey(): Promise<{ key: CryptoKey; salt: string }> {
  if (memoryKey && memorySalt) return { key: memoryKey, salt: memorySalt };
  const remembered = await loadKey();
  if (remembered) {
    setMemoryKey(remembered.key, remembered.salt);
    return { key: remembered.key, salt: remembered.salt };
  }
  throw new Error('Enter your sync passphrase to unlock this device.');
}

function parseEnvelope(raw: string): SyncEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('The cloud copy is not valid JSON.');
  }
  if (!isSyncEnvelope(parsed)) {
    throw new Error('The Gist does not contain an Interview OS sync snapshot.');
  }
  return parsed;
}

function validateRemoteData(payload: SyncPayload): AppData {
  if (payload.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `The cloud copy was created by a newer app version (v${payload.schemaVersion}). Update this app before syncing.`,
    );
  }
  const parsed = appDataSchema.safeParse(payload.data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(
      `The cloud copy has an incompatible data format${first?.path.length ? ` at ${first.path.join('.')}` : ''}.`,
    );
  }
  return parsed.data as AppData;
}

async function fetchRemoteSnapshot(
  token: string,
  gistId: string,
  fileName: string,
  key: CryptoKey,
): Promise<RemoteSnapshot> {
  const gist = await getGist(token, gistId);
  const raw = await readGistFile(gist, fileName);
  const envelope = parseEnvelope(raw);
  if (envelope.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `The cloud copy was created by a newer app version (v${envelope.schemaVersion}). Update this app before syncing.`,
    );
  }
  const payload = await decryptSnapshot(envelope, key);
  const data = validateRemoteData(payload);
  return { gist, envelope, data };
}

async function buildEnvelope(
  data: AppData,
  key: CryptoKey,
  salt: string,
  revision: number,
  deviceId: string,
): Promise<SyncEnvelope> {
  const timestamp = nowISO();
  return encryptSnapshot(
    {
      schemaVersion: SCHEMA_VERSION,
      revision,
      updatedAt: timestamp,
      deviceId,
      data,
    },
    key,
    salt,
  );
}

function envelopeJson(envelope: SyncEnvelope): string {
  const json = JSON.stringify(envelope);
  const size = new TextEncoder().encode(json).length;
  if (size > SYNC_MAX_ENCRYPTED_BYTES) {
    throw new Error(
      `The encrypted workspace is ${(size / 1024).toFixed(0)} KB, which is above the safe sync limit. Trim large notes and try again.`,
    );
  }
  return json;
}

async function pushSnapshot(
  token: string,
  gistId: string,
  fileName: string,
  data: AppData,
  key: CryptoKey,
  salt: string,
  revision: number,
  deviceId: string,
): Promise<{ envelope: SyncEnvelope; revision: number }> {
  const envelope = await buildEnvelope(data, key, salt, revision, deviceId);
  await updateGist(token, gistId, fileName, envelopeJson(envelope));
  return { envelope, revision };
}

function errorStatus(error: unknown): { status: SyncStatus; message: string; kind: string } {
  if (error instanceof SyncApiError) {
    if (error.kind === 'auth' || error.kind === 'permission') {
      return { status: 'auth-error', message: error.message, kind: error.kind };
    }
    if (error.kind === 'rate-limit') {
      return { status: 'rate-limited', message: error.message, kind: error.kind };
    }
    if (error.kind === 'network') {
      return { status: 'offline', message: error.message, kind: error.kind };
    }
    return { status: 'error', message: error.message, kind: error.kind };
  }
  if (error instanceof SyncCryptoError) {
    return { status: 'error', message: error.message, kind: 'crypto' };
  }
  return {
    status: 'error',
    message: error instanceof Error ? error.message : 'Sync failed.',
    kind: 'unknown',
  };
}

function comparableData(data: AppData): string {
  // Theme is a per-device preference. Including it would make two devices with
  // different themes push revisions back and forth forever.
  return stableStringify(data, new Set(['theme']));
}

async function runSync(options: { forcePull?: boolean; forcePush?: boolean } = {}): Promise<SyncResult> {
  const syncStore = useSyncStore.getState();
  const config = requireConfig();
  const token = requireToken();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    syncStore.setStatus('offline');
    const message = 'You are offline. Changes will sync when the connection returns.';
    useSyncStore.getState().setError(message, 'offline');
    useSyncStore.getState().setStatus('offline');
    return { ok: false, pushed: false, pulled: false, merged: false, message, error: message };
  }

  let key: CryptoKey;
  let salt: string;
  try {
    ({ key, salt } = await ensureKey());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync is locked.';
    useSyncStore.getState().setStatus('locked');
    useSyncStore.getState().setError(message, 'locked');
    return { ok: false, pushed: false, pulled: false, merged: false, message, error: message };
  }

  useSyncStore.getState().setStatus('syncing');
  useSyncStore.getState().setError(null);

  try {
    const remote = await fetchRemoteSnapshot(token, config.gistId, config.fileName, key);
    const local = useAppStore.getState().data;

    if (options.forcePull) {
      applyData({
        ...remote.data,
        settings: { ...remote.data.settings, theme: local.settings.theme },
      });
      useSyncStore.getState().markSynced(remote.envelope.revision, remote.envelope.updatedAt);
      return {
        ok: true,
        pushed: false,
        pulled: true,
        merged: false,
        revision: remote.envelope.revision,
        message: 'Cloud data restored to this device.',
      };
    }

    const merged = options.forcePush
      ? local
      : unlinkMissingApplications(mergeAppData(local, remote.data));
    const localChanged = comparableData(merged) !== comparableData(local);
    const remoteChanged = comparableData(merged) !== comparableData(remote.data);
    const shouldPush = options.forcePush || remoteChanged;

    if (localChanged) applyData(merged);

    let revision = remote.envelope.revision;
    let updatedAt = remote.envelope.updatedAt;
    if (shouldPush) {
      const nextRevision = remote.envelope.revision + 1;
      const pushed = await pushSnapshot(
        token,
        config.gistId,
        config.fileName,
        merged,
        key,
        salt,
        nextRevision,
        getDeviceId(),
      );
      revision = nextRevision;
      updatedAt = pushed.envelope.updatedAt;
    }

    useSyncStore.getState().markSynced(revision, updatedAt);

    return {
      ok: true,
      pushed: shouldPush,
      pulled: true,
      merged: localChanged || shouldPush,
      revision,
      message: shouldPush ? 'Workspace synced to the cloud.' : 'Already up to date.',
    };
  } catch (error) {
    const detail = errorStatus(error);
    useSyncStore.getState().setError(detail.message, detail.kind);
    useSyncStore.getState().setStatus(detail.status);
    return {
      ok: false,
      pushed: false,
      pulled: false,
      merged: false,
      message: detail.message,
      error: detail.message,
    };
  }
}

export function syncNow(options: { forcePull?: boolean; forcePush?: boolean } = {}): Promise<SyncResult> {
  if (activeSync) return activeSync;
  activeSync = runSync(options)
    .catch((error: unknown) => {
      const detail = errorStatus(error);
      useSyncStore.getState().setError(detail.message, detail.kind);
      useSyncStore.getState().setStatus(detail.status);
      return {
        ok: false,
        pushed: false,
        pulled: false,
        merged: false,
        message: detail.message,
        error: detail.message,
      };
    })
    .finally(() => {
      activeSync = null;
    });
  return activeSync;
}

export async function restoreRememberedKey(): Promise<boolean> {
  try {
    const remembered = await loadKey();
    if (!remembered) {
      useSyncStore.getState().setKeyReady(false);
      return false;
    }
    setMemoryKey(remembered.key, remembered.salt);
    return true;
  } catch {
    useSyncStore.getState().setKeyReady(false);
    return false;
  }
}

export async function unlockSync(passphrase: string): Promise<void> {
  const config = requireConfig();
  const token = requireToken();
  const gist = await getGist(token, config.gistId);
  const raw = await readGistFile(gist, config.fileName);
  const envelope = parseEnvelope(raw);
  if (envelope.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `The cloud copy was created by a newer app version (v${envelope.schemaVersion}). Update this app before syncing.`,
    );
  }
  const key = await deriveKey(passphrase, envelope.kdf.salt, envelope.kdf.iterations);
  await decryptSnapshot(envelope, key);
  setMemoryKey(key, envelope.kdf.salt);
  await saveKey(key, envelope.kdf.salt);
  useSyncStore.getState().setStatus('idle');
  useSyncStore.getState().setError(null);
}

export async function forgetDeviceKey(): Promise<void> {
  clearMemoryKey();
  try {
    await clearKey();
  } catch {
    // The in-memory key is already gone; a failed IndexedDB delete is surfaced by the UI.
  }
  const config = useSyncStore.getState().config;
  if (config.enabled) useSyncStore.getState().setStatus('locked');
}

export interface CreateSyncOptions {
  token: string;
  passphrase: string;
}

export async function createSyncGist({ token, passphrase }: CreateSyncOptions): Promise<{ gistId: string; login: string }> {
  if (passphrase.length < SYNC_MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Use at least ${SYNC_MIN_PASSPHRASE_LENGTH} characters for the passphrase.`);
  }
  const cleanToken = token.trim();
  if (!cleanToken) throw new Error('Paste a GitHub token first.');

  const salt = createSalt();
  const key = await deriveKey(passphrase, salt);
  const data = useAppStore.getState().data;
  const envelope = await buildEnvelope(data, key, salt, 1, getDeviceId());
  const gist = await createGist(cleanToken, SYNC_FILE_NAME, envelopeJson(envelope));

  setStoredToken(cleanToken);
  await saveKey(key, salt);
  setMemoryKey(key, salt);
  const syncStore = useSyncStore.getState();
  syncStore.setConfig({
    enabled: true,
    gistId: gist.id,
    fileName: SYNC_FILE_NAME,
    githubLogin: gist.owner?.login ?? '',
    deviceId: getDeviceId(),
    autoSync: true,
    lastRemoteRevision: 1,
    lastRemoteUpdatedAt: envelope.updatedAt,
    lastSyncedAt: nowISO(),
  });
  syncStore.clearDirty();
  syncStore.markSynced(1, envelope.updatedAt);
  syncStore.setError(null);
  return { gistId: gist.id, login: gist.owner?.login ?? '' };
}

export interface JoinSyncOptions {
  token: string;
  gistId: string;
  passphrase: string;
  mode: JoinMode;
}

export async function joinSyncGist({
  token,
  gistId,
  passphrase,
  mode,
}: JoinSyncOptions): Promise<{ login: string; recordCount: number }> {
  const cleanToken = token.trim();
  if (!cleanToken) throw new Error('Paste a GitHub token first.');
  const gist = await getGist(cleanToken, gistId);
  const raw = await readGistFile(gist, SYNC_FILE_NAME);
  const envelope = parseEnvelope(raw);
  if (envelope.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `The cloud copy was created by a newer app version (v${envelope.schemaVersion}). Update this app before syncing.`,
    );
  }
  const key = await deriveKey(passphrase, envelope.kdf.salt, envelope.kdf.iterations);
  const payload = await decryptSnapshot(envelope, key);
  const remoteData = validateRemoteData(payload);
  const localData = useAppStore.getState().data;
  const localTheme = localData.settings.theme;

  if (mode === 'replace') {
    applyData({ ...remoteData, settings: { ...remoteData.settings, theme: localTheme } });
  } else {
    applyData(unlinkMissingApplications(mergeAppData(localData, remoteData)));
  }

  setStoredToken(cleanToken);
  await saveKey(key, envelope.kdf.salt);
  setMemoryKey(key, envelope.kdf.salt);
  const syncStore = useSyncStore.getState();
  syncStore.setConfig({
    enabled: true,
    gistId: gist.id,
    fileName: SYNC_FILE_NAME,
    githubLogin: gist.owner?.login ?? '',
    deviceId: getDeviceId(),
    autoSync: true,
    lastRemoteRevision: envelope.revision,
    lastRemoteUpdatedAt: envelope.updatedAt,
    lastSyncedAt: nowISO(),
  });
  syncStore.clearDirty();
  syncStore.markSynced(envelope.revision, envelope.updatedAt);
  syncStore.setError(null);

  if (mode === 'merge') {
    await syncNow();
  }

  const recordCount =
    remoteData.roadmap.length +
    remoteData.applications.length +
    remoteData.interviews.length +
    remoteData.notes.length;

  return { login: gist.owner?.login ?? '', recordCount };
}

export async function changePassphrase(newPassphrase: string): Promise<void> {
  if (newPassphrase.length < SYNC_MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Use at least ${SYNC_MIN_PASSPHRASE_LENGTH} characters for the passphrase.`);
  }
  const config = requireConfig();
  const token = requireToken();
  const { key: oldKey } = await ensureKey();
  const remote = await fetchRemoteSnapshot(token, config.gistId, config.fileName, oldKey);
  const merged = unlinkMissingApplications(mergeAppData(useAppStore.getState().data, remote.data));
  applyData(merged);

  const salt = createSalt();
  const key = await deriveKey(newPassphrase, salt);
  const nextRevision = remote.envelope.revision + 1;
  const pushed = await pushSnapshot(
    token,
    config.gistId,
    config.fileName,
    merged,
    key,
    salt,
    nextRevision,
    getDeviceId(),
  );
  await saveKey(key, salt);
  setMemoryKey(key, salt);
  useSyncStore.getState().markSynced(pushed.revision, pushed.envelope.updatedAt);
}

export async function disconnectSync(deleteCloudCopy = false): Promise<void> {
  const config = useSyncStore.getState().config;
  const token = getStoredToken();
  if (deleteCloudCopy && token && config.gistId) {
    await deleteGist(token, config.gistId);
  }
  clearStoredToken();
  clearMemoryKey();
  try {
    await clearKey();
  } catch {
    // Local data and cloud data are already handled; the UI can retry clearing the key.
  }
  useSyncStore.getState().resetConnection();
}


