import type {
  AppData,
  DailyLog,
  Goal,
  Milestone,
  RoadmapTask,
  RoadmapWeek,
  Settings,
  SyncMeta,
  TechCategory,
  TechTopic,
} from '../../types';
import { SYNC_EPOCH } from './constants';
import { stableStringify } from '../utils';

export type TombstoneKind =
  | 'roadmap'
  | 'timetable'
  | 'applications'
  | 'interviews'
  | 'mockInterviews'
  | 'tasks'
  | 'goals'
  | 'companies'
  | 'notes'
  | 'techCategories'
  | 'techTopics'
  | 'roadmapTasks'
  | 'milestones';

export function tombstoneId(kind: TombstoneKind, id: string): string {
  return `${kind}:${id}`;
}

function later(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? SYNC_EPOCH;
  if (!b) return a;
  return a >= b ? a : b;
}

function isPostReset(
  timestamp: string | undefined,
  sideResetAt: string | undefined,
  newestResetAt: string | undefined,
): boolean {
  if (!newestResetAt) return true;
  if (sideResetAt === newestResetAt) return true;
  return (timestamp ?? SYNC_EPOCH) >= newestResetAt;
}

function chooseNewer<T extends { updatedAt: string }>(local: T, remote: T): T {
  if (remote.updatedAt > local.updatedAt) return remote;
  if (local.updatedAt > remote.updatedAt) return local;
  // Equal timestamps are rare, but both devices must make the same choice.
  return stableStringify(local) >= stableStringify(remote) ? local : remote;
}

function mergeTombstones(local: SyncMeta, remote: SyncMeta, newestResetAt?: string): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(local.tombstones)) {
    if (isPostReset(value, local.resetAt, newestResetAt)) merged[key] = value;
  }
  for (const [key, value] of Object.entries(remote.tombstones)) {
    if (!isPostReset(value, remote.resetAt, newestResetAt)) continue;
    merged[key] = later(merged[key], value);
  }
  return merged;
}

function mergeById<T extends { id: string; updatedAt: string }>(
  localItems: T[],
  remoteItems: T[],
  tombstones: Record<string, string>,
  kind: TombstoneKind,
): T[] {
  const merged = new Map<string, T>();
  for (const item of localItems) {
    if (tombstones[tombstoneId(kind, item.id)]) continue;
    merged.set(item.id, item);
  }
  for (const item of remoteItems) {
    if (tombstones[tombstoneId(kind, item.id)]) continue;
    const current = merged.get(item.id);
    merged.set(item.id, current ? chooseNewer(current, item) : item);
  }
  return Array.from(merged.values());
}

function mergeRoadmapTasks(
  local: RoadmapTask[],
  remote: RoadmapTask[],
  localParentTime: string,
  remoteParentTime: string,
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): RoadmapTask[] {
  const merged = new Map<string, RoadmapTask>();
  const add = (task: RoadmapTask, parentTime: string, sideResetAt?: string) => {
    if (tombstones[tombstoneId('roadmapTasks', task.id)]) return;
    const time = task.updatedAt ?? parentTime;
    if (!isPostReset(time, sideResetAt, newestResetAt)) return;
    const current = merged.get(task.id);
    if (!current) {
      merged.set(task.id, { ...task, updatedAt: time });
      return;
    }
    const currentTime = current.updatedAt ?? SYNC_EPOCH;
    if (time > currentTime || (time === currentTime && stableStringify(task) >= stableStringify(current))) {
      merged.set(task.id, { ...task, updatedAt: time });
    }
  };
  local.forEach((task) => add(task, localParentTime, localResetAt));
  remote.forEach((task) => add(task, remoteParentTime, remoteResetAt));
  return Array.from(merged.values());
}

function mergeRoadmapWeek(
  local: RoadmapWeek,
  remote: RoadmapWeek,
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): RoadmapWeek {
  const base = chooseNewer(local, remote);
  const tasks = mergeRoadmapTasks(
    local.tasks,
    remote.tasks,
    local.updatedAt,
    remote.updatedAt,
    tombstones,
    localResetAt,
    remoteResetAt,
    newestResetAt,
  );
  const latestTaskTime = tasks.reduce((latest, task) => later(latest, task.updatedAt), base.updatedAt);
  return { ...base, tasks, updatedAt: latestTaskTime };
}

function mergeTechTopics(
  local: TechTopic[],
  remote: TechTopic[],
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): TechTopic[] {
  const merged = new Map<string, TechTopic>();
  const add = (topic: TechTopic, sideResetAt?: string) => {
    if (tombstones[tombstoneId('techTopics', topic.id)]) return;
    if (!isPostReset(topic.updatedAt, sideResetAt, newestResetAt)) return;
    const current = merged.get(topic.id);
    merged.set(topic.id, current ? chooseNewer(current, topic) : topic);
  };
  local.forEach((topic) => add(topic, localResetAt));
  remote.forEach((topic) => add(topic, remoteResetAt));
  return Array.from(merged.values());
}

function mergeTechCategory(
  local: TechCategory,
  remote: TechCategory,
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): TechCategory {
  const base = chooseNewer(local, remote);
  const topics = mergeTechTopics(
    local.topics,
    remote.topics,
    tombstones,
    localResetAt,
    remoteResetAt,
    newestResetAt,
  );
  const latestTopicTime = topics.reduce((latest, topic) => later(latest, topic.updatedAt), base.updatedAt);
  return { ...base, topics, updatedAt: latestTopicTime };
}

function mergeMilestones(
  local: Milestone[],
  remote: Milestone[],
  localParentTime: string,
  remoteParentTime: string,
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): Milestone[] {
  const merged = new Map<string, Milestone>();
  const add = (milestone: Milestone, parentTime: string, sideResetAt?: string) => {
    if (tombstones[tombstoneId('milestones', milestone.id)]) return;
    const time = milestone.updatedAt ?? parentTime;
    if (!isPostReset(time, sideResetAt, newestResetAt)) return;
    const current = merged.get(milestone.id);
    if (!current) {
      merged.set(milestone.id, { ...milestone, updatedAt: time });
      return;
    }
    const currentTime = current.updatedAt ?? SYNC_EPOCH;
    if (time > currentTime || (time === currentTime && stableStringify(milestone) >= stableStringify(current))) {
      merged.set(milestone.id, { ...milestone, updatedAt: time });
    }
  };
  local.forEach((milestone) => add(milestone, localParentTime, localResetAt));
  remote.forEach((milestone) => add(milestone, remoteParentTime, remoteResetAt));
  return Array.from(merged.values());
}

function mergeGoal(
  local: Goal,
  remote: Goal,
  tombstones: Record<string, string>,
  localResetAt?: string,
  remoteResetAt?: string,
  newestResetAt?: string,
): Goal {
  const base = chooseNewer(local, remote);
  const milestones = mergeMilestones(
    local.milestones,
    remote.milestones,
    local.updatedAt,
    remote.updatedAt,
    tombstones,
    localResetAt,
    remoteResetAt,
    newestResetAt,
  );
  const latestMilestoneTime = milestones.reduce(
    (latest, milestone) => later(latest, milestone.updatedAt),
    base.updatedAt,
  );
  return { ...base, milestones, updatedAt: latestMilestoneTime };
}

function mergeDailyLog(local: DailyLog, remote: DailyLog): DailyLog {
  const localJson = stableStringify(local);
  const remoteJson = stableStringify(remote);
  return localJson >= remoteJson ? local : remote;
}

function mergeSettings(
  local: Settings,
  remote: Settings,
  localMeta: SyncMeta,
  remoteMeta: SyncMeta,
  newestResetAt?: string,
): Settings {
  const localValid = isPostReset(localMeta.settingsUpdatedAt, localMeta.resetAt, newestResetAt);
  const remoteValid = isPostReset(remoteMeta.settingsUpdatedAt, remoteMeta.resetAt, newestResetAt);
  let chosen: Settings;
  if (localValid && remoteValid) {
    const remoteNewer = remoteMeta.settingsUpdatedAt > localMeta.settingsUpdatedAt;
    const localNewer = localMeta.settingsUpdatedAt > remoteMeta.settingsUpdatedAt;
    chosen = remoteNewer
      ? remote
      : localNewer
        ? local
        : stableStringify(local) >= stableStringify(remote)
          ? local
          : remote;
  } else if (localValid) {
    chosen = local;
  } else if (remoteValid) {
    chosen = remote;
  } else {
    chosen = local;
  }

  // Appearance is a per-device preference, not workspace data.
  return { ...chosen, theme: local.theme };
}

function mergeDailyLogs(
  local: AppData,
  remote: AppData,
  newestResetAt?: string,
): Record<string, DailyLog> {
  const merged: Record<string, DailyLog> = {};
  const dates = new Set([
    ...Object.keys(local.dailyLogs),
    ...Object.keys(remote.dailyLogs),
  ]);

  for (const date of dates) {
    const localLog = local.dailyLogs[date];
    const remoteLog = remote.dailyLogs[date];
    const localTime = local.syncMeta.dailyLogsUpdatedAt[date];
    const remoteTime = remote.syncMeta.dailyLogsUpdatedAt[date];
    const localValid = localLog && isPostReset(localTime, local.syncMeta.resetAt, newestResetAt);
    const remoteValid = remoteLog && isPostReset(remoteTime, remote.syncMeta.resetAt, newestResetAt);

    if (localLog && localValid && remoteLog && remoteValid) {
      if ((remoteTime ?? SYNC_EPOCH) > (localTime ?? SYNC_EPOCH)) {
        merged[date] = remoteLog;
      } else if ((localTime ?? SYNC_EPOCH) > (remoteTime ?? SYNC_EPOCH)) {
        merged[date] = localLog;
      } else {
        merged[date] = mergeDailyLog(localLog, remoteLog);
      }
    } else if (localLog && localValid) {
      merged[date] = localLog;
    } else if (remoteLog && remoteValid) {
      merged[date] = remoteLog;
    }
  }

  return merged;
}

function mergeDailyLogTimestamps(
  local: SyncMeta,
  remote: SyncMeta,
  newestResetAt?: string,
): Record<string, string> {
  const merged: Record<string, string> = {};
  const dates = new Set([
    ...Object.keys(local.dailyLogsUpdatedAt),
    ...Object.keys(remote.dailyLogsUpdatedAt),
  ]);
  for (const date of dates) {
    const localTime = local.dailyLogsUpdatedAt[date];
    const remoteTime = remote.dailyLogsUpdatedAt[date];
    if (isPostReset(localTime, local.resetAt, newestResetAt)) {
      merged[date] = later(merged[date], localTime);
    }
    if (isPostReset(remoteTime, remote.resetAt, newestResetAt)) {
      merged[date] = later(merged[date], remoteTime);
    }
  }
  return merged;
}

/**
 * Timestamp-aware, tombstone-aware merge. The same function is used for
 * cloud sync and for importing a backup so both paths behave consistently.
 */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const newestResetAt =
    local.syncMeta.resetAt && remote.syncMeta.resetAt
      ? later(local.syncMeta.resetAt, remote.syncMeta.resetAt)
      : local.syncMeta.resetAt ?? remote.syncMeta.resetAt;
  const tombstones = mergeTombstones(local.syncMeta, remote.syncMeta, newestResetAt);
  const localRoadmap = local.roadmap.filter((item) =>
    isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
  );
  const remoteRoadmap = remote.roadmap.filter((item) =>
    isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
  );
  const localTechCategories = local.techCategories.filter((item) =>
    isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
  );
  const remoteTechCategories = remote.techCategories.filter((item) =>
    isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
  );
  const localApplications = local.applications.filter((item) =>
    isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
  );
  const remoteApplications = remote.applications.filter((item) =>
    isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
  );
  const localGoals = local.goals.filter((item) =>
    isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
  );
  const remoteGoals = remote.goals.filter((item) =>
    isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
  );

  return {
    settings: mergeSettings(local.settings, remote.settings, local.syncMeta, remote.syncMeta, newestResetAt),
    roadmap: mergeById(localRoadmap, remoteRoadmap, tombstones, 'roadmap').map((week) => {
      const localWeek = localRoadmap.find((item) => item.id === week.id);
      const remoteWeek = remoteRoadmap.find((item) => item.id === week.id);
      return localWeek && remoteWeek
        ? mergeRoadmapWeek(
            localWeek,
            remoteWeek,
            tombstones,
            local.syncMeta.resetAt,
            remote.syncMeta.resetAt,
            newestResetAt,
          )
        : week;
    }),
    timetable: mergeById(
      local.timetable.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.timetable.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'timetable',
    ),
    dailyLogs: mergeDailyLogs(local, remote, newestResetAt),
    techCategories: mergeById(
      localTechCategories,
      remoteTechCategories,
      tombstones,
      'techCategories',
    ).map((category) => {
      const localCategory = localTechCategories.find((item) => item.id === category.id);
      const remoteCategory = remoteTechCategories.find((item) => item.id === category.id);
      return localCategory && remoteCategory
        ? mergeTechCategory(
            localCategory,
            remoteCategory,
            tombstones,
            local.syncMeta.resetAt,
            remote.syncMeta.resetAt,
            newestResetAt,
          )
        : category;
    }),
    applications: mergeById(
      localApplications,
      remoteApplications,
      tombstones,
      'applications',
    ).map((application) => {
      const localApplication = localApplications.find((item) => item.id === application.id);
      const remoteApplication = remoteApplications.find((item) => item.id === application.id);
      if (!localApplication || !remoteApplication) return application;

      const history = new Map<string, (typeof application.history)[number]>();
      [...localApplication.history, ...remoteApplication.history].forEach((entry) => {
        const current = history.get(entry.id);
        if (!current || entry.date >= current.date) history.set(entry.id, entry);
      });
      return {
        ...chooseNewer(localApplication, remoteApplication),
        history: Array.from(history.values()).sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),
    interviews: mergeById(
      local.interviews.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.interviews.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'interviews',
    ),
    mockInterviews: mergeById(
      local.mockInterviews.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.mockInterviews.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'mockInterviews',
    ),
    tasks: mergeById(
      local.tasks.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.tasks.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'tasks',
    ),
    goals: mergeById(localGoals, remoteGoals, tombstones, 'goals').map((goal) => {
      const localGoal = localGoals.find((item) => item.id === goal.id);
      const remoteGoal = remoteGoals.find((item) => item.id === goal.id);
      return localGoal && remoteGoal
        ? mergeGoal(
            localGoal,
            remoteGoal,
            tombstones,
            local.syncMeta.resetAt,
            remote.syncMeta.resetAt,
            newestResetAt,
          )
        : goal;
    }),
    companies: mergeById(
      local.companies.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.companies.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'companies',
    ),
    notes: mergeById(
      local.notes.filter((item) =>
        isPostReset(item.updatedAt, local.syncMeta.resetAt, newestResetAt),
      ),
      remote.notes.filter((item) =>
        isPostReset(item.updatedAt, remote.syncMeta.resetAt, newestResetAt),
      ),
      tombstones,
      'notes',
    ),
    syncMeta: {
      settingsUpdatedAt: later(
        local.syncMeta.settingsUpdatedAt,
        remote.syncMeta.settingsUpdatedAt,
      ),
      dailyLogsUpdatedAt: mergeDailyLogTimestamps(local.syncMeta, remote.syncMeta, newestResetAt),
      tombstones,
      ...(newestResetAt ? { resetAt: newestResetAt } : {}),
    },
  };
}

export function unlinkMissingApplications(data: AppData): AppData {
  const ids = new Set(data.applications.map((application) => application.id));
  let changed = false;
  const interviews = data.interviews.map((interview) => {
    if (!interview.applicationId || ids.has(interview.applicationId)) return interview;
    changed = true;
    return { ...interview, applicationId: '', updatedAt: new Date().toISOString() };
  });
  return changed ? { ...data, interviews } : data;
}
