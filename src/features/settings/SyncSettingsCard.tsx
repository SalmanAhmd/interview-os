import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Cloud,
  CloudCheck,
  CloudOff,
  CloudUpload,
  ExternalLink,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox, Input } from '../../components/ui/input';
import { Dialog, ConfirmDialog } from '../../components/ui/dialog';
import { Field } from '../../components/ui/field';
import { useToast } from '../../hooks/useToast';
import { useSyncStore, type SyncStatus } from '../../stores/useSyncStore';
import {
  changePassphrase,
  createSyncGist,
  disconnectSync,
  forgetDeviceKey,
  joinSyncGist,
  syncNow,
  unlockSync,
  type JoinMode,
} from '../../lib/sync/engine';
import { gistUrl, parseGistId } from '../../lib/sync/gist';
import { relativeTime } from '../../lib/dates';
import { SYNC_MIN_PASSPHRASE_LENGTH } from '../../lib/sync/constants';

type SetupMode = 'create' | 'join';
type DisconnectMode = 'keep' | 'delete';

const statusMeta: Record<
  SyncStatus,
  { label: string; tone: string; icon: typeof Cloud; spinning?: boolean }
> = {
  disconnected: { label: 'Sync off', tone: 'text-muted-foreground', icon: CloudOff },
  locked: { label: 'Locked', tone: 'text-warning', icon: LockKeyhole },
  idle: { label: 'Ready', tone: 'text-muted-foreground', icon: Cloud },
  pending: { label: 'Unsynced', tone: 'text-warning', icon: CloudUpload },
  syncing: { label: 'Syncing', tone: 'text-accent', icon: RefreshCw, spinning: true },
  synced: { label: 'Synced', tone: 'text-success', icon: CloudCheck },
  offline: { label: 'Offline', tone: 'text-muted-foreground', icon: CloudOff },
  'rate-limited': { label: 'Rate limited', tone: 'text-danger', icon: AlertTriangle },
  'auth-error': { label: 'Token issue', tone: 'text-danger', icon: AlertTriangle },
  error: { label: 'Sync error', tone: 'text-danger', icon: AlertTriangle },
};

function maskedGist(gistId: string): string {
  if (gistId.length <= 12) return gistId;
  return `${gistId.slice(0, 8)}…${gistId.slice(-4)}`;
}

export function SyncSettingsCard() {
  const config = useSyncStore((state) => state.config);
  const status = useSyncStore((state) => state.status);
  const keyReady = useSyncStore((state) => state.keyReady);
  const pendingChanges = useSyncStore((state) => state.pendingChanges);
  const lastError = useSyncStore((state) => state.lastError);
  const setConfig = useSyncStore((state) => state.setConfig);
  const setError = useSyncStore((state) => state.setError);
  const { success, error: toastError } = useToast();

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupInitialMode, setSetupInitialMode] = useState<SetupMode>('create');
  const [changeOpen, setChangeOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<DisconnectMode | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  const meta = statusMeta[status] ?? statusMeta.idle;
  const StatusIcon = meta.spinning ? Loader2 : meta.icon;

  const handleSyncNow = async () => {
    setSyncing(true);
    setUnlockError(null);
    try {
      const result = await syncNow();
      if (result.ok) {
        success(result.message, {
          description: result.pushed ? 'Latest local changes are encrypted in your Gist.' : undefined,
        });
      } else {
        toastError('Sync failed', { description: result.message });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    setUnlockError(null);
    setUnlocking(true);
    try {
      await unlockSync(unlockPassphrase);
      setUnlockPassphrase('');
      success('Sync unlocked', { description: 'This device can now sync again.' });
      void handleSyncNow();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not unlock sync.';
      setUnlockError(message);
      setError(message, 'unlock');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = async () => {
    setLocking(true);
    try {
      await forgetDeviceKey();
      success('This device is locked', {
        description: 'Your passphrase is needed to sync again.',
      });
    } catch (error) {
      toastError('Could not lock sync', {
        description: error instanceof Error ? error.message : 'Try again.',
      });
    } finally {
      setLocking(false);
    }
  };

  const handleChangePassphrase = async (event: FormEvent) => {
    event.preventDefault();
    setChangeError(null);
    if (newPassphrase.length < SYNC_MIN_PASSPHRASE_LENGTH) {
      setChangeError(`Use at least ${SYNC_MIN_PASSPHRASE_LENGTH} characters.`);
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      setChangeError('The passphrases do not match.');
      return;
    }
    setChanging(true);
    try {
      await changePassphrase(newPassphrase);
      setNewPassphrase('');
      setConfirmPassphrase('');
      setChangeOpen(false);
      success('Passphrase changed', {
        description: 'The cloud snapshot was re-encrypted with the new passphrase.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not change the passphrase.';
      setChangeError(message);
    } finally {
      setChanging(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget || disconnecting) return;
    setDisconnecting(true);
    try {
      await disconnectSync(disconnectTarget === 'delete');
      success(
        disconnectTarget === 'delete' ? 'Cloud copy deleted' : 'Sync disconnected',
        {
          description:
            disconnectTarget === 'delete'
              ? 'The Gist was deleted. Local data is unchanged.'
              : 'Cloud sync is off. Local data is unchanged.',
        },
      );
      setDisconnectTarget(null);
    } catch (error) {
      toastError(
        disconnectTarget === 'delete' ? 'Could not delete the cloud copy' : 'Could not disconnect',
        { description: error instanceof Error ? error.message : 'Try again.' },
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card id="sync">
        <CardHeader
          title="Cross-device sync"
          description="Optional encrypted mirror in a secret GitHub Gist. Local storage remains the source of truth."
          action={
            config.enabled ? (
              <span className={`inline-flex items-center gap-1.5 text-2xs font-medium ${meta.tone}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${meta.spinning ? 'animate-spin' : ''}`} />
                {meta.label}
              </span>
            ) : undefined
          }
        />
        <CardContent className="space-y-4">
          {!config.enabled ? (
            <>
              <div className="rounded-lg border border-border bg-muted/15 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-accent">
                    <Cloud className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold">Use the same workspace on laptop and phone</h3>
                    <p className="mt-1 text-2xs leading-5 text-muted-foreground">
                      The app encrypts your workspace in the browser, then stores it in a Gist you own. You choose one
                      passphrase; it is never uploaded. The GitHub token and passphrase-derived key stay on this
                      device.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSetupInitialMode('create');
                      setSetupOpen(true);
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Set up encrypted sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSetupInitialMode('join');
                      setSetupOpen(true);
                    }}
                  >
                    Join an existing Gist
                  </Button>
                </div>
              </div>
              <p className="text-2xs leading-5 text-muted-foreground">
                A secret Gist is unlisted, not private. The file is authenticated encryption (AES-GCM-256 with
                PBKDF2-SHA-256), but GitHub still sees the Gist and its revision history. There is no passphrase
                recovery if you forget it.
              </p>
            </>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2.5">
                  <div className="text-2xs text-muted-foreground">Gist</div>
                  <a
                    href={gistUrl(config.gistId)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 font-mono text-2xs font-medium text-foreground hover:text-accent"
                  >
                    {maskedGist(config.gistId)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2.5">
                  <div className="text-2xs text-muted-foreground">Last sync</div>
                  <div className="mt-0.5 text-2xs font-medium">
                    {config.lastSyncedAt ? relativeTime(config.lastSyncedAt) : 'Not synced yet'}
                    {pendingChanges ? <span className="ml-1.5 text-warning">· local changes waiting</span> : null}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2.5">
                  <div className="text-2xs text-muted-foreground">Encryption</div>
                  <div className="mt-0.5 text-2xs font-medium">AES-GCM-256 · PBKDF2 600k</div>
                </div>
                <div className="rounded-md border border-border bg-muted/10 px-3 py-2.5">
                  <div className="text-2xs text-muted-foreground">Cloud owner</div>
                  <div className="mt-0.5 text-2xs font-medium">
                    {config.githubLogin ? config.githubLogin : 'Connected account'}
                    {config.lastRemoteRevision !== null ? ` · rev ${config.lastRemoteRevision}` : ''}
                  </div>
                </div>
              </div>

              {!keyReady ? (
                <form
                  onSubmit={handleUnlock}
                  className="rounded-lg border border-warning/25 bg-warning/[0.03] p-3"
                >
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-3.5 w-3.5 text-warning" />
                    <h3 className="text-xs font-semibold">Unlock this device</h3>
                  </div>
                  <p className="mt-1 text-2xs leading-4 text-muted-foreground">
                    The remembered key is missing. Enter your sync passphrase to decrypt the cloud copy on this
                    device.
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="password"
                      value={unlockPassphrase}
                      onChange={(event) => setUnlockPassphrase(event.target.value)}
                      placeholder="Sync passphrase"
                      aria-label="Sync passphrase"
                      autoComplete="current-password"
                      className="h-8 text-xs"
                      aria-invalid={!!unlockError}
                      data-autofocus
                    />
                    <Button type="submit" size="sm" loading={unlocking} disabled={!unlockPassphrase}>
                      <KeyRound className="h-3.5 w-3.5" />
                      Unlock
                    </Button>
                  </div>
                  {unlockError ? (
                    <p className="mt-1.5 text-2xs text-danger" role="alert">
                      {unlockError}
                    </p>
                  ) : null}
                </form>
              ) : null}

              {lastError ? (
                <div className="flex items-start justify-between gap-3 rounded-md border border-danger/25 bg-danger/[0.03] px-3 py-2.5">
                  <div className="flex min-w-0 items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                    <p className="min-w-0 text-2xs leading-4 text-muted-foreground">{lastError}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-2xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={handleSyncNow} loading={syncing} disabled={!keyReady}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync now
                </Button>
                <label className="inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-md border border-border bg-card px-2.5 text-2xs font-medium shadow-xs">
                  <Checkbox
                    checked={config.autoSync}
                    onChange={(event) => {
                      setConfig({ autoSync: event.target.checked });
                      if (event.target.checked && keyReady) void handleSyncNow();
                    }}
                  />
                  Auto-sync
                </label>
                {keyReady ? (
                  <Button variant="outline" size="sm" onClick={handleLock} loading={locking}>
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Lock
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangeError(null);
                    setChangeOpen(true);
                  }}
                  disabled={!keyReady}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Change passphrase
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDisconnectTarget('keep')}
                  disabled={disconnecting}
                >
                  <Unplug className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/[0.06] hover:text-danger"
                  onClick={() => setDisconnectTarget('delete')}
                  disabled={disconnecting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete cloud copy
                </Button>
              </div>

              <p className="text-2xs leading-5 text-muted-foreground">
                Local edits sync automatically after 4 seconds, on launch, focus, reconnect and every 5 minutes.
                Conflicts merge newest-wins per record. Theme stays local to each device.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <SyncSetupDialog
        key={setupInitialMode}
        initialMode={setupInitialMode}
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
      />

      <Dialog
        open={changeOpen}
        onClose={() => {
          setChangeOpen(false);
          setChangeError(null);
          setNewPassphrase('');
          setConfirmPassphrase('');
        }}
        title="Change sync passphrase"
        description="The cloud snapshot is re-encrypted with a new key. Other devices must unlock with the new passphrase."
        size="sm"
      >
        <form id="change-sync-passphrase" onSubmit={handleChangePassphrase} className="space-y-3">
          <Field
            label="New passphrase"
            htmlFor="change-passphrase"
            hint={`At least ${SYNC_MIN_PASSPHRASE_LENGTH} characters.`}
          >
            <Input
              id="change-passphrase"
              type="password"
              autoComplete="new-password"
              value={newPassphrase}
              onChange={(event) => setNewPassphrase(event.target.value)}
            />
          </Field>
          <Field label="Confirm new passphrase" htmlFor="change-passphrase-confirm">
            <Input
              id="change-passphrase-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
            />
          </Field>
          {changeError ? (
            <p className="text-xs text-danger" role="alert">
              {changeError}
            </p>
          ) : null}
        </form>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setChangeOpen(false);
              setNewPassphrase('');
              setConfirmPassphrase('');
              setChangeError(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="change-sync-passphrase" size="sm" loading={changing}>
            Change passphrase
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={disconnectTarget !== null}
        title={disconnectTarget === 'delete' ? 'Delete the cloud copy?' : 'Disconnect sync?'}
        description={
          disconnectTarget === 'delete'
            ? 'This deletes the encrypted Gist and its revision history from GitHub. Local data stays in this browser. This cannot be undone.'
            : 'This stops syncing on this device and removes the saved GitHub token and key. The encrypted Gist stays on GitHub, and local data is unchanged.'
        }
        confirmLabel={
          disconnecting
            ? 'Working…'
            : disconnectTarget === 'delete'
              ? 'Delete cloud copy'
              : 'Disconnect'
        }
        tone="danger"
        onCancel={() => {
          if (!disconnecting) setDisconnectTarget(null);
        }}
        onConfirm={() => void handleDisconnect()}
      />
    </>
  );
}

function SyncSetupDialog({
  initialMode,
  open,
  onClose,
}: {
  initialMode: SetupMode;
  open: boolean;
  onClose: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [mode, setMode] = useState<SetupMode>(initialMode);
  const [token, setToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [gistInput, setGistInput] = useState('');
  const [joinMode, setJoinMode] = useState<JoinMode>('replace');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reset = () => {
    setMode(initialMode);
    setToken('');
    setPassphrase('');
    setConfirmPassphrase('');
    setGistInput('');
    setJoinMode('replace');
    setFormError(null);
    setBusy(false);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!token.trim()) {
      setFormError('Paste a GitHub token first.');
      return;
    }
    if (passphrase.length < SYNC_MIN_PASSPHRASE_LENGTH) {
      setFormError(`Use at least ${SYNC_MIN_PASSPHRASE_LENGTH} characters for the passphrase.`);
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setFormError('The passphrases do not match.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'create') {
        const result = await createSyncGist({ token, passphrase });
        success('Encrypted sync created', {
          description: `Gist ${result.gistId.slice(0, 8)}… is ready. Save your passphrase somewhere safe.`,
        });
      } else {
        const gistId = parseGistId(gistInput);
        if (!gistId) {
          setFormError('Paste a valid Gist URL or Gist ID.');
          setBusy(false);
          return;
        }
        const result = await joinSyncGist({ token, gistId, passphrase, mode: joinMode });
        success('Connected to your cloud workspace', {
          description: `${result.login || 'GitHub'} · ${joinMode === 'replace' ? 'cloud data applied' : 'records merged'}.`,
        });
      }
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not set up sync.';
      setFormError(message);
      toastError('Sync setup failed', { description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Set up encrypted sync"
      description="One Gist, one passphrase, every device. Your token and key stay on this device."
      size="lg"
    >
      <form id="sync-setup-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/20 p-1">
          {(['create', 'join'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setFormError(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === value ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {value === 'create' ? 'Create new' : 'Join existing'}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/15 p-3 text-2xs leading-5 text-muted-foreground">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>
              Create a <strong className="text-foreground">fine-grained GitHub token</strong> with account permission
              <strong className="text-foreground"> Gists: Read and write</strong> (or a classic token with the
              <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono">gist</code> scope). The token is stored
              only in this browser and is never included in exports.
            </span>
          </p>
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-medium text-accent underline underline-offset-4"
          >
            Create a token
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <Field label="GitHub token" htmlFor="sync-token" hint="Fine-grained Gists read/write, or classic gist scope." required>
          <Input
            id="sync-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="github_pat_… or ghp_…"
            autoComplete="off"
            data-autofocus
          />
        </Field>

        {mode === 'join' ? (
          <>
            <Field
              label="Gist URL or ID"
              htmlFor="sync-gist"
              hint="Open the Gist on GitHub and copy its URL. The sync file must be interview-os.enc.json."
              required
            >
              <Input
                id="sync-gist"
                value={gistInput}
                onChange={(event) => setGistInput(event.target.value)}
                placeholder="https://gist.github.com/you/abcdef1234567890"
                autoComplete="off"
              />
            </Field>
            <div className="space-y-2">
              <p className="text-xs font-medium">How should cloud data be applied?</p>
              <label
                className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-xs ${
                  joinMode === 'replace' ? 'border-accent/50 bg-accent/[0.03]' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="join-mode"
                  value="replace"
                  checked={joinMode === 'replace'}
                  onChange={() => setJoinMode('replace')}
                  className="mt-0.5 accent-[hsl(var(--accent))]"
                />
                <span>
                  <span className="block font-medium">Use the cloud workspace</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-muted-foreground">
                    Replaces local records with the cloud copy. Your theme stays local. Recommended for a new phone
                    or browser.
                  </span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-xs ${
                  joinMode === 'merge' ? 'border-accent/50 bg-accent/[0.03]' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="join-mode"
                  value="merge"
                  checked={joinMode === 'merge'}
                  onChange={() => setJoinMode('merge')}
                  className="mt-0.5 accent-[hsl(var(--accent))]"
                />
                <span>
                  <span className="block font-medium">Merge with local data</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-muted-foreground">
                    Combines both copies newest-wins. Local records are uploaded if they are newer.
                  </span>
                </span>
              </label>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-border bg-muted/15 px-3 py-2 text-2xs leading-4 text-muted-foreground">
            This device&apos;s current workspace becomes the first encrypted snapshot. Export a JSON backup first if
            you are unsure.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Sync passphrase"
            htmlFor="sync-passphrase"
            hint={`At least ${SYNC_MIN_PASSPHRASE_LENGTH} characters. Never uploaded.`}
            required
          >
            <Input
              id="sync-passphrase"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm passphrase" htmlFor="sync-confirm" required>
            <Input
              id="sync-confirm"
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="rounded-md border border-warning/25 bg-warning/[0.03] px-3 py-2 text-2xs leading-4 text-muted-foreground">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span>
              There is no passphrase recovery. If you forget it, delete the Gist and create a new sync. Old Gist
              revisions remain decryptable with the old passphrase until GitHub deletes them.
            </span>
          </p>
        </div>

        {formError ? (
          <p className="text-xs text-danger" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" type="button" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={busy}>
            {mode === 'create' ? 'Create encrypted sync' : 'Connect this device'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
