import {
  SYNC_GIST_DESCRIPTION,
  SYNC_REQUEST_TIMEOUT_MS,
} from './constants';

const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2022-11-28';

export interface GistFile {
  filename: string;
  content?: string;
  truncated?: boolean;
  raw_url?: string;
  size?: number;
}

export interface Gist {
  id: string;
  description: string | null;
  public: boolean;
  files: Record<string, GistFile>;
  owner?: {
    login: string;
  } | null;
  updated_at: string;
  history?: Array<{ version: string; committed_at: string }>;
}

export type SyncApiErrorKind =
  | 'auth'
  | 'permission'
  | 'rate-limit'
  | 'not-found'
  | 'invalid'
  | 'network'
  | 'server'
  | 'unknown';

export class SyncApiError extends Error {
  status: number;
  kind: SyncApiErrorKind;
  resetAt?: string;

  constructor(message: string, kind: SyncApiErrorKind, status = 0, resetAt?: string) {
    super(message);
    this.name = 'SyncApiError';
    this.kind = kind;
    this.status = status;
    this.resetAt = resetAt;
  }
}

function headers(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
}

async function request(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: { ...headers(token), ...(init.headers ?? {}) },
      signal: controller.signal,
    });
    if (response.ok) return response;

    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : undefined;
    let message = response.statusText || 'GitHub request failed.';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // The status text is enough when GitHub does not return JSON.
    }

    if (response.status === 401) {
      throw new SyncApiError('The GitHub token is invalid or expired.', 'auth', response.status);
    }
    if (response.status === 403) {
      if (remaining === '0') {
        throw new SyncApiError(
          `GitHub rate limit reached${resetAt ? ` until ${new Date(resetAt).toLocaleString()}` : ''}.`,
          'rate-limit',
          response.status,
          resetAt,
        );
      }
      throw new SyncApiError(
        'GitHub rejected the token. Check that it has Gists write permission.',
        'permission',
        response.status,
      );
    }
    if (response.status === 404) {
      throw new SyncApiError(
        'The sync Gist was not found. It may have been deleted or this token cannot access it.',
        'not-found',
        response.status,
      );
    }
    if (response.status === 422) {
      throw new SyncApiError('GitHub rejected the sync payload. It may be too large.', 'invalid', response.status);
    }
    if (response.status >= 500) {
      throw new SyncApiError('GitHub is temporarily unavailable. Try again shortly.', 'server', response.status);
    }
    throw new SyncApiError(message, 'unknown', response.status);
  } catch (error) {
    if (error instanceof SyncApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SyncApiError('GitHub did not respond in time. Check your connection and try again.', 'network');
    }
    throw new SyncApiError(
      'Could not reach GitHub. Check your connection and try again.',
      'network',
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function createGist(token: string, fileName: string, content: string): Promise<Gist> {
  const response = await request(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: SYNC_GIST_DESCRIPTION,
      public: false,
      files: { [fileName]: { content } },
    }),
  });
  return (await response.json()) as Gist;
}

export async function getGist(token: string, gistId: string): Promise<Gist> {
  const response = await request(token, `/gists/${encodeURIComponent(gistId)}`);
  return (await response.json()) as Gist;
}

export async function updateGist(
  token: string,
  gistId: string,
  fileName: string,
  content: string,
): Promise<Gist> {
  const response = await request(token, `/gists/${encodeURIComponent(gistId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      files: { [fileName]: { content } },
    }),
  });
  return (await response.json()) as Gist;
}

export async function deleteGist(token: string, gistId: string): Promise<void> {
  await request(token, `/gists/${encodeURIComponent(gistId)}`, {
    method: 'DELETE',
  });
}

export async function readGistFile(
  gist: Gist,
  fileName: string,
): Promise<string> {
  const file = gist.files?.[fileName];
  if (!file) {
    throw new SyncApiError(
      `The Gist does not contain ${fileName}. Choose a Gist created by Interview OS.`,
      'invalid',
    );
  }
  if (!file.truncated && typeof file.content === 'string') {
    return file.content;
  }
  if (!file.raw_url) {
    throw new SyncApiError('GitHub returned an incomplete sync file and no raw URL.', 'invalid');
  }

  // Gist raw URLs live on a different host. GitHub does not expose them through
  // the /gists API, so fetch the URL directly. Secret Gist raw URLs are
  // unlisted but readable without the token.
  try {
    const response = await fetch(file.raw_url, { headers: { Accept: 'text/plain' } });
    if (!response.ok) {
      throw new SyncApiError('Could not download the complete sync file from GitHub.', 'network', response.status);
    }
    return response.text();
  } catch (error) {
    if (error instanceof SyncApiError) throw error;
    throw new SyncApiError('Could not download the complete sync file from GitHub.', 'network');
  }
}

export function parseGistId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-f0-9]{20,}$/i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (!/(^|\.)gist\.github\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split('/').filter(Boolean);
    const candidate = [...segments].reverse().find((segment) => /^[a-f0-9]{20,}$/i.test(segment));
    return candidate ?? null;
  } catch {
    return null;
  }
}

export function gistUrl(gistId: string): string {
  return `https://gist.github.com/${gistId}`;
}
