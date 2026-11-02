import type { AppData } from '../../types';
import {
  PBKDF2_ITERATIONS,
  SYNC_APP_ID,
  SYNC_FORMAT_VERSION,
  SYNC_IV_BYTES,
  SYNC_SALT_BYTES,
} from './constants';

export type SyncCompression = 'gzip' | 'none';

export interface SyncEnvelope {
  app: typeof SYNC_APP_ID;
  format: number;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  compression: SyncCompression;
  kdf: {
    name: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
  };
  cipher: 'AES-GCM-256';
  iv: string;
  ciphertext: string;
}

export interface SyncPayload {
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: AppData;
}

export class SyncCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncCryptoError';
  }
}

function assertWebCrypto() {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new SyncCryptoError('Encryption is not available in this browser. Use a modern browser over HTTPS.');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function randomBase64(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bytesToBase64(bytes);
}

function buildAdditionalData(meta: Omit<SyncEnvelope, 'iv' | 'ciphertext'>): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      app: meta.app,
      format: meta.format,
      schemaVersion: meta.schemaVersion,
      revision: meta.revision,
      updatedAt: meta.updatedAt,
      deviceId: meta.deviceId,
      compression: meta.compression,
      kdf: meta.kdf,
      cipher: meta.cipher,
    }),
  );
}

async function compress(bytes: Uint8Array): Promise<{ bytes: Uint8Array; compression: SyncCompression }> {
  if (typeof CompressionStream === 'undefined') {
    return { bytes, compression: 'none' };
  }
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'));
    return { bytes: new Uint8Array(await new Response(stream).arrayBuffer()), compression: 'gzip' };
  } catch {
    return { bytes, compression: 'none' };
  }
}

async function decompress(bytes: Uint8Array, compression: SyncCompression): Promise<Uint8Array> {
  if (compression === 'none') return bytes;
  if (typeof DecompressionStream === 'undefined') {
    throw new SyncCryptoError('This browser cannot decompress the cloud snapshot. Update your browser and try again.');
  }
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new SyncCryptoError('The cloud snapshot is corrupted and could not be decompressed.');
  }
}

export function createSalt(): string {
  assertWebCrypto();
  return randomBase64(SYNC_SALT_BYTES);
}

export async function deriveKey(
  passphrase: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  assertWebCrypto();
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt) as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptSnapshot(
  payload: SyncPayload,
  key: CryptoKey,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<SyncEnvelope> {
  assertWebCrypto();
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await compress(plaintext);
  const meta: Omit<SyncEnvelope, 'iv' | 'ciphertext'> = {
    app: SYNC_APP_ID,
    format: SYNC_FORMAT_VERSION,
    schemaVersion: payload.schemaVersion,
    revision: payload.revision,
    updatedAt: payload.updatedAt,
    deviceId: payload.deviceId,
    compression: compressed.compression,
    kdf: {
      name: 'PBKDF2-SHA-256',
      iterations,
      salt,
    },
    cipher: 'AES-GCM-256',
  };
  const iv = crypto.getRandomValues(new Uint8Array(SYNC_IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      additionalData: buildAdditionalData(meta) as BufferSource,
      tagLength: 128,
    },
    key,
    compressed.bytes as BufferSource,
  );

  return {
    ...meta,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptSnapshot(
  envelope: SyncEnvelope,
  key: CryptoKey,
): Promise<SyncPayload> {
  assertWebCrypto();
  if (envelope.app !== SYNC_APP_ID) {
    throw new SyncCryptoError('This file is not an Interview OS sync snapshot.');
  }
  if (envelope.format !== SYNC_FORMAT_VERSION) {
    throw new SyncCryptoError('This cloud snapshot uses a newer encryption format. Update the app first.');
  }
  if (envelope.compression !== 'gzip' && envelope.compression !== 'none') {
    throw new SyncCryptoError('The cloud snapshot uses an unsupported compression format.');
  }

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(envelope.iv) as BufferSource,
        additionalData: buildAdditionalData({
          app: envelope.app,
          format: envelope.format,
          schemaVersion: envelope.schemaVersion,
          revision: envelope.revision,
          updatedAt: envelope.updatedAt,
          deviceId: envelope.deviceId,
          compression: envelope.compression,
          kdf: envelope.kdf,
          cipher: envelope.cipher,
        }) as BufferSource,
        tagLength: 128,
      },
      key,
      base64ToBytes(envelope.ciphertext) as BufferSource,
    );
  } catch {
    throw new SyncCryptoError('Could not decrypt the cloud copy. Check your passphrase and try again.');
  }

  const bytes = await decompress(new Uint8Array(plaintext), envelope.compression);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as SyncPayload;
  } catch {
    throw new SyncCryptoError('The decrypted cloud snapshot is not valid JSON.');
  }
}

export function isSyncEnvelope(value: unknown): value is SyncEnvelope {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SyncEnvelope>;
  return (
    candidate.app === SYNC_APP_ID &&
    typeof candidate.format === 'number' &&
    typeof candidate.schemaVersion === 'number' &&
    typeof candidate.revision === 'number' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.deviceId === 'string' &&
    (candidate.compression === 'gzip' || candidate.compression === 'none') &&
    candidate.kdf?.name === 'PBKDF2-SHA-256' &&
    typeof candidate.kdf.iterations === 'number' &&
    typeof candidate.kdf.salt === 'string' &&
    candidate.cipher === 'AES-GCM-256' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.ciphertext === 'string'
  );
}

export function envelopeSummary(envelope: SyncEnvelope): string {
  const bytes = Math.ceil((envelope.ciphertext.length * 3) / 4);
  return `${new Date(envelope.updatedAt).toLocaleString()} · revision ${envelope.revision} · ${(bytes / 1024).toFixed(1)} KB`;
}
