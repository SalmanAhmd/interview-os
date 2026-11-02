import {
  SYNC_SALT_BYTES,
  SYNC_TOKEN_STORAGE_KEY,
  SYNC_MIN_PASSPHRASE_LENGTH,
} from './constants';

const DB_NAME = 'interview-prep-os-sync';
const DB_VERSION = 1;
const STORE = 'keys';
const KEY_ID = 'device-key';

export interface StoredKeyRecord {
  id: string;
  key: CryptoKey;
  salt: string;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'));
  });
}

export async function saveKey(key: CryptoKey, salt: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id: KEY_ID, key, salt, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not save the sync key.'));
    tx.onabort = () => reject(tx.error ?? new Error('Saving the sync key was aborted.'));
  });
}

export async function loadKey(): Promise<StoredKeyRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(KEY_ID);
    request.onsuccess = () => {
      const result = request.result as StoredKeyRecord | undefined;
      resolve(result ?? null);
    };
    request.onerror = () => reject(request.error ?? new Error('Could not load the sync key.'));
  });
}

export async function clearKey(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not clear the sync key.'));
    tx.onabort = () => reject(tx.error ?? new Error('Clearing the sync key was aborted.'));
  });
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(SYNC_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(SYNC_TOKEN_STORAGE_KEY, token.trim());
  } catch {
    // Ignore storage failures; the user will be prompted again.
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(SYNC_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function validatePassphrase(passphrase: string): string | null {
  if (passphrase.length < SYNC_MIN_PASSPHRASE_LENGTH) {
    return `Use at least ${SYNC_MIN_PASSPHRASE_LENGTH} characters for the passphrase.`;
  }
  return null;
}

export function createDeviceId(): string {
  const key = 'interview-prep-os-device-id';
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    window.localStorage.setItem(key, `dev_${id}`);
    return `dev_${id}`;
  } catch {
    return `dev_${Date.now().toString(36)}`;
  }
}

export function getDeviceId(): string {
  const key = 'interview-prep-os-device-id';
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
  } catch {
    // fall through
  }
  return createDeviceId();
}

export function randomSaltBase64(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SYNC_SALT_BYTES));
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
