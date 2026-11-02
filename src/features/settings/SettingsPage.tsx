import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Database,
  Download,
  FileJson,
  HardDrive,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Settings2,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import type { AppData } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Input, Textarea } from '../../components/ui/input';
import { Dialog, ConfirmDialog } from '../../components/ui/dialog';
import {
  downloadBackup,
  exportApplicationsCsv,
  exportInterviewsCsv,
  exportRoadmapCsv,
  validateImportJson,
  type ImportMode,
  type ImportValidationResult,
} from '../../lib/storage/backup';
import { SCHEMA_VERSION, defaultSettings } from '../../data/initial-data';
import { STORAGE_KEY } from '../../lib/storage/storage';
import { formatDate } from '../../lib/dates';
import { formatLakhs, parseTags, splitLines } from '../../lib/utils';

const settingsFormSchema = z.object({
  userName: z.string().trim().min(2, 'Add your name.'),
  targetCompensationLakhs: z.number().min(0, 'Target compensation cannot be negative.'),
  dailyStudyGoalHours: z.number().min(0).max(24, 'Keep this below 24 hours.'),
  defaultStudyDuration: z.number().int('Use whole minutes.').min(5, 'At least 5 minutes.').max(480, 'Keep this realistic.'),
  prepStartDate: z.string().min(1, 'Add the preparation start date.'),
  plannedResignationDate: z.string().min(1, 'Add the planned resignation date.'),
  noticePeriodDays: z.number().int('Use whole days.').min(0).max(365),
  targetLwd: z.string().min(1, 'Add the target last working day.'),
  preferredLocations: z.string(),
  preferredRoles: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

function toDefaults(settings: typeof defaultSettings): SettingsFormValues {
  return {
    userName: settings.userName,
    targetCompensationLakhs: Number((settings.targetCompensation / 1_00_000).toFixed(2)),
    dailyStudyGoalHours: settings.dailyStudyGoalHours,
    defaultStudyDuration: settings.defaultStudyDuration,
    prepStartDate: settings.prepStartDate,
    plannedResignationDate: settings.plannedResignationDate,
    noticePeriodDays: settings.noticePeriodDays,
    targetLwd: settings.targetLwd,
    preferredLocations: settings.preferredLocations.join(', '),
    preferredRoles: settings.preferredRoles.join('\n'),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const THEMES = [
  { value: 'light', label: 'Light', description: 'Bright and crisp', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { value: 'system', label: 'System', description: 'Match your device', icon: Monitor },
] as const;

export default function SettingsPage() {
  const data = useAppStore((state) => state.data);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const importData = useAppStore((state) => state.importData);
  const resetAllData = useAppStore((state) => state.resetAllData);
  const restoreRoadmap = useAppStore((state) => state.restoreRoadmap);
  const restoreTimetable = useAppStore((state) => state.restoreTimetable);
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: AppData;
    summary: NonNullable<ImportValidationResult['summary']>;
    fileName: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [resetTarget, setResetTarget] = useState<'all' | 'roadmap' | 'timetable' | null>(null);
  const settings = data.settings;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toDefaults(settings),
  });

  const totalTopics = data.techCategories.reduce((sum, category) => sum + category.topics.length, 0);
  const counts = [
    { label: 'Roadmap weeks', value: data.roadmap.length },
    { label: 'Timetable slots', value: data.timetable.length },
    { label: 'Technical topics', value: totalTopics },
    { label: 'Applications', value: data.applications.length },
    { label: 'Interviews', value: data.interviews.length },
    { label: 'Mock interviews', value: data.mockInterviews.length },
    { label: 'Tasks', value: data.tasks.length },
    { label: 'Goals', value: data.goals.length },
    { label: 'Companies', value: data.companies.length },
    { label: 'Notes', value: data.notes.length },
  ];

  const snapshotBytes = useMemo(() => new Blob([JSON.stringify(data)]).size, [data]);
  const storageAvailable = useMemo(() => {
    try {
      const key = `${STORAGE_KEY}-probe`;
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }, []);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings({
      userName: values.userName.trim(),
      targetCompensation: Math.round(values.targetCompensationLakhs * 1_00_000),
      dailyStudyGoalHours: values.dailyStudyGoalHours,
      defaultStudyDuration: values.defaultStudyDuration,
      prepStartDate: values.prepStartDate,
      plannedResignationDate: values.plannedResignationDate,
      noticePeriodDays: values.noticePeriodDays,
      targetLwd: values.targetLwd,
      preferredLocations: parseTags(values.preferredLocations),
      preferredRoles: splitLines(values.preferredRoles),
    });
    success('Preferences saved', { description: 'Your preparation profile is up to date.' });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    success('Theme updated', { description: `Using ${theme} theme.` });
  };

  const handleExportBackup = () => {
    downloadBackup(data);
    success('Backup exported', { description: 'JSON download started. Keep it somewhere safe.' });
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = await file.text();
      const result = validateImportJson(raw);
      if (!result.success || !result.data || !result.summary) {
        error('Import failed', { description: result.error ?? 'The backup could not be read.' });
        return;
      }
      setImportMode('merge');
      setPendingImport({ data: result.data, summary: result.summary, fileName: file.name });
    } catch {
      error('Import failed', { description: 'The selected file could not be read.' });
    }
  };

  const applyImport = () => {
    if (!pendingImport) return;
    importData(pendingImport.data, importMode);
    if (importMode === 'replace') reset(toDefaults(pendingImport.data.settings));
    success(importMode === 'replace' ? 'Backup restored' : 'Backup merged', {
      description: `${pendingImport.fileName} · ${importMode === 'replace' ? 'replaced all data' : 'added new records'}`,
    });
    setPendingImport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (resetTarget === 'all') {
      resetAllData();
      reset(toDefaults(defaultSettings));
      success('Everything reset', { description: 'The app is back to its default plan and empty trackers.' });
    }
    if (resetTarget === 'roadmap') {
      restoreRoadmap();
      success('Roadmap restored', { description: 'The original 22-week plan is back.' });
    }
    if (resetTarget === 'timetable') {
      restoreTimetable();
      success('Timetable restored', { description: 'The original weekly schedule is back.' });
    }
    setResetTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace configuration"
        title="Settings"
        description="Tune your preparation profile, appearance and local data. Everything is stored in this browser — export backups regularly."
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile & targets" description="Used across the dashboard and planning views." />
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormGrid>
                  <Field label="Your name" htmlFor="set-name" error={errors.userName?.message} required>
                    <Input id="set-name" data-autofocus {...register('userName')} aria-invalid={!!errors.userName} />
                  </Field>
                  <Field label="Target compensation (₹ lakhs)" htmlFor="set-compensation" error={errors.targetCompensationLakhs?.message} hint={`Currently ${formatLakhs(settings.targetCompensation)} per year`}>
                    <Input
                      id="set-compensation"
                      type="number"
                      min={0}
                      step={0.5}
                      {...register('targetCompensationLakhs', { valueAsNumber: true })}
                      aria-invalid={!!errors.targetCompensationLakhs}
                    />
                  </Field>
                  <Field label="Daily study goal (hours)" htmlFor="set-daily-hours" error={errors.dailyStudyGoalHours?.message}>
                    <Input
                      id="set-daily-hours"
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      {...register('dailyStudyGoalHours', { valueAsNumber: true })}
                      aria-invalid={!!errors.dailyStudyGoalHours}
                    />
                  </Field>
                  <Field label="Default activity duration (minutes)" htmlFor="set-duration" error={errors.defaultStudyDuration?.message}>
                    <Input
                      id="set-duration"
                      type="number"
                      min={5}
                      max={480}
                      step={5}
                      {...register('defaultStudyDuration', { valueAsNumber: true })}
                      aria-invalid={!!errors.defaultStudyDuration}
                    />
                  </Field>
                  <Field label="Preparation start date" htmlFor="set-start-date" error={errors.prepStartDate?.message}>
                    <Input id="set-start-date" type="date" {...register('prepStartDate')} aria-invalid={!!errors.prepStartDate} />
                  </Field>
                  <Field label="Planned resignation date" htmlFor="set-resignation-date" error={errors.plannedResignationDate?.message}>
                    <Input id="set-resignation-date" type="date" {...register('plannedResignationDate')} aria-invalid={!!errors.plannedResignationDate} />
                  </Field>
                  <Field label="Notice period (days)" htmlFor="set-notice" error={errors.noticePeriodDays?.message}>
                    <Input
                      id="set-notice"
                      type="number"
                      min={0}
                      max={365}
                      {...register('noticePeriodDays', { valueAsNumber: true })}
                      aria-invalid={!!errors.noticePeriodDays}
                    />
                  </Field>
                  <Field label="Target last working day" htmlFor="set-lwd" error={errors.targetLwd?.message}>
                    <Input id="set-lwd" type="date" {...register('targetLwd')} aria-invalid={!!errors.targetLwd} />
                  </Field>
                </FormGrid>

                <Field label="Preferred locations" htmlFor="set-locations" hint="Comma separated">
                  <Input id="set-locations" {...register('preferredLocations')} placeholder="Mumbai, Remote (India)" />
                </Field>
                <Field label="Preferred roles" htmlFor="set-roles" hint="One per line">
                  <Textarea id="set-roles" rows={4} {...register('preferredRoles')} />
                </Field>

                <div className="flex justify-end">
                  <Button type="submit" loading={isSubmitting}>
                    <Save className="h-4 w-4" />
                    Save preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Data & backup" description="Export a complete JSON snapshot or move data between browsers." />
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-accent" />
                    <h3 className="text-xs font-semibold">Full backup</h3>
                  </div>
                  <p className="mt-1 text-2xs leading-4 text-muted-foreground">
                    Includes settings, roadmap, timetable, applications, interviews, notes and every other module.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleExportBackup}>
                    <Download className="h-3.5 w-3.5" />
                    Export JSON backup
                  </Button>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent" />
                    <h3 className="text-xs font-semibold">Restore backup</h3>
                  </div>
                  <p className="mt-1 text-2xs leading-4 text-muted-foreground">
                    Validate a JSON backup, preview the record counts, then merge or replace.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(event) => handleImportFile(event.target.files?.[0])}
                  />
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    Import JSON backup
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold">CSV exports</h3>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  Spreadsheet-friendly exports for the pipeline and plan.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportApplicationsCsv(data.applications);
                      success('Applications CSV exported');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Applications ({data.applications.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportInterviewsCsv(data.interviews);
                      success('Interview log CSV exported');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Interviews ({data.interviews.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportRoadmapCsv(data.roadmap);
                      success('Roadmap CSV exported');
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Roadmap ({data.roadmap.length})
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold">Restore defaults</h3>
                <p className="mt-0.5 text-2xs text-muted-foreground">
                  Replace the current roadmap or timetable with the original seeded plan. Your other data is kept.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setResetTarget('roadmap')}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore roadmap
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setResetTarget('timetable')}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore timetable
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-danger/25 bg-danger/[0.03] p-4">
                <h3 className="text-xs font-semibold text-danger">Reset everything</h3>
                <p className="mt-1 text-2xs leading-4 text-muted-foreground">
                  Deletes all applications, interviews, mocks, tasks, notes and research, then restores the seeded
                  roadmap, timetable and goals. Export a backup first.
                </p>
                <Button variant="danger" size="sm" className="mt-3" onClick={() => setResetTarget('all')}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset all data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Appearance" description="Choose how the app looks on this device." />
            <CardContent className="space-y-2">
              {THEMES.map((theme) => {
                const Icon = theme.icon;
                const active = settings.theme === theme.value;
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setTheme(theme.value)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      active ? 'border-accent/50 bg-accent/[0.04]' : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{theme.label}</span>
                      <span className="block text-2xs text-muted-foreground">{theme.description}</span>
                    </span>
                    {active ? <span className="text-2xs font-medium text-accent">Active</span> : null}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Local storage" description="No account, no cloud — just this browser." />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5" />
                  Storage
                </span>
                <span className={storageAvailable ? 'font-medium text-success' : 'font-medium text-danger'}>
                  {storageAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  Snapshot size
                </span>
                <span className="font-medium tabular-nums">{formatBytes(snapshotBytes)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Schema version</span>
                <span className="font-medium">v{SCHEMA_VERSION}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target LWD</span>
                <span className="font-medium">{formatDate(settings.targetLwd)}</span>
              </div>
              <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-2xs leading-4 text-muted-foreground">
                Storage key: <code className="font-mono">{STORAGE_KEY}</code>. Clearing browser data will remove
                your progress — keep a JSON backup.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Record counts" description="What is currently stored in this browser." />
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {counts.map((count) => (
                  <div key={count.label} className="flex items-center justify-between">
                    <dt className="text-muted-foreground">{count.label}</dt>
                    <dd className="font-medium tabular-nums">{count.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="About" description="Interview OS · local-first preparation dashboard" />
            <CardContent className="space-y-2 text-2xs leading-5 text-muted-foreground">
              <p className="flex items-start gap-1.5">
                <Settings2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Built for a Senior / Lead Frontend Engineer transition targeting ₹50 LPA+ roles.
              </p>
              <p>
                Recommended workflow: plan the week in the roadmap, execute in the timetable, log interviews and
                mocks, then review the dashboard. Export a backup at the end of each week.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        title="Import backup"
        description={pendingImport ? `${pendingImport.fileName} passed validation.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button onClick={applyImport} variant={importMode === 'replace' ? 'danger' : 'primary'}>
              {importMode === 'replace' ? 'Replace all data' : 'Merge new records'}
            </Button>
          </>
        }
      >
        {pendingImport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs sm:grid-cols-3">
              {Object.entries(pendingImport.summary).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">How should this backup be applied?</p>
              <label className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-xs ${importMode === 'merge' ? 'border-accent/50 bg-accent/[0.03]' : 'border-border'}`}>
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-0.5 accent-[hsl(var(--accent))]"
                />
                <span>
                  <span className="block font-medium">Merge with current data</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-muted-foreground">
                    Existing records win by ID. Imported records with new IDs are added. Settings stay unchanged.
                  </span>
                </span>
              </label>
              <label className={`flex cursor-pointer gap-2 rounded-lg border p-3 text-xs ${importMode === 'replace' ? 'border-danger/50 bg-danger/[0.03]' : 'border-border'}`}>
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 accent-[hsl(var(--danger))]"
                />
                <span>
                  <span className="block font-medium text-danger">Replace everything</span>
                  <span className="mt-0.5 block text-2xs leading-4 text-muted-foreground">
                    The backup becomes the source of truth for all data and settings. This cannot be undone.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={resetTarget !== null}
        title={
          resetTarget === 'all'
            ? 'Reset all data?'
            : resetTarget === 'roadmap'
              ? 'Restore the default roadmap?'
              : 'Restore the default timetable?'
        }
        description={
          resetTarget === 'all'
            ? 'Every application, interview, mock, task, note and company record will be deleted, and seeded defaults restored. Export a backup first.'
            : resetTarget === 'roadmap'
              ? 'Current week statuses, notes and progress will be replaced with the original 22-week plan. Applications and other data stay.'
              : 'Current study slots will be replaced with the original weekly schedule. Completion history stays in daily logs.'
        }
        confirmLabel={resetTarget === 'all' ? 'Reset all data' : 'Restore defaults'}
        onCancel={() => setResetTarget(null)}
        onConfirm={handleReset}
      />
    </div>
  );
}
