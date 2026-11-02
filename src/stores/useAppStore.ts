import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createInitialData, createDefaultRoadmap, createDefaultTimetable, SCHEMA_VERSION } from '../data/initial-data';
import type {
  AppData,
  ApplicationStage,
  Company,
  Goal,
  InterviewRecord,
  JobApplication,
  MockInterview,
  Note,
  RoadmapWeek,
  Settings,
  SlotStatus,
  SyncMeta,
  Task,
  TechCategory,
  TechTopic,
  TimetableSlot,
  WeekStatus,
} from '../types';
import { clamp, createId, nextISO, nowISO } from '../lib/utils';
import { createSafePersistStorage, migratePersistedState, STORAGE_KEY } from '../lib/storage/storage';
import { mergeAppData, tombstoneId, unlinkMissingApplications } from '../lib/sync/merge';
import type { ImportMode } from '../lib/storage/backup';

type NewTopic = Omit<TechTopic, 'id' | 'createdAt' | 'updatedAt'>;
type NewApplication = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'history'>;
type NewInterview = Omit<InterviewRecord, 'id' | 'createdAt' | 'updatedAt'>;
type NewMock = Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'>;
type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
type NewGoal = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;
type NewCompany = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;
type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
type NewSlot = Omit<TimetableSlot, 'id' | 'createdAt' | 'updatedAt'>;

export interface AppStore {
  data: AppData;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAllData: () => void;
  importData: (incoming: AppData, mode: ImportMode) => void;
  applyRemoteData: (data: AppData) => void;
  restoreRoadmap: () => void;
  restoreTimetable: () => void;

  updateWeek: (weekId: string, patch: Partial<RoadmapWeek>) => void;
  setWeekStatus: (weekId: string, status: WeekStatus) => void;
  setWeekProgress: (weekId: string, progress: number) => void;
  addWeekTask: (weekId: string, title: string) => void;
  toggleWeekTask: (weekId: string, taskId: string) => void;
  deleteWeekTask: (weekId: string, taskId: string) => void;

  addSlot: (slot: NewSlot) => void;
  updateSlot: (slotId: string, patch: Partial<TimetableSlot>) => void;
  deleteSlot: (slotId: string) => void;
  setSlotStatus: (dateKey: string, slotId: string, status: SlotStatus | null) => void;
  setDailyNote: (dateKey: string, notes: string) => void;

  addTopic: (categoryId: string, topic: NewTopic) => void;
  updateTopic: (categoryId: string, topicId: string, patch: Partial<TechTopic>) => void;
  deleteTopic: (categoryId: string, topicId: string) => void;
  updateCategory: (categoryId: string, patch: Partial<Pick<TechCategory, 'name' | 'description'>>) => void;

  addApplication: (application: NewApplication) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  setApplicationStage: (id: string, stage: ApplicationStage, note?: string) => void;
  deleteApplication: (id: string) => void;

  addInterview: (interview: NewInterview) => void;
  updateInterview: (id: string, patch: Partial<InterviewRecord>) => void;
  deleteInterview: (id: string) => void;

  addMock: (mock: NewMock) => void;
  updateMock: (id: string, patch: Partial<MockInterview>) => void;
  deleteMock: (id: string) => void;

  addTask: (task: NewTask) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  addGoal: (goal: NewGoal) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  addCompany: (company: NewCompany) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addNote: (note: NewNote) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleNotePin: (id: string) => void;
}

const touch = <T extends { updatedAt: string }>(entity: T, patch: Partial<T>): T => ({
  ...entity,
  ...patch,
  updatedAt: nextISO(entity.updatedAt),
});

function addTombstones(meta: SyncMeta, keys: string[], timestamp = nowISO()): SyncMeta {
  if (!keys.length) return meta;
  return {
    ...meta,
    tombstones: {
      ...meta.tombstones,
      ...Object.fromEntries(keys.map((key) => [key, timestamp])),
    },
  };
}

function removeTombstonePrefixes(meta: SyncMeta, prefixes: string[]): SyncMeta {
  const tombstones = Object.fromEntries(
    Object.entries(meta.tombstones).filter(
      ([key]) => !prefixes.some((prefix) => key.startsWith(`${prefix}:`)),
    ),
  );
  return { ...meta, tombstones };
}

function removeTombstoneKeys(meta: SyncMeta, keys: string[]): SyncMeta {
  if (!keys.length) return meta;
  const tombstones = { ...meta.tombstones };
  keys.forEach((key) => delete tombstones[key]);
  return { ...meta, tombstones };
}

function stampAfterReset(data: AppData): AppData {
  const resetAt = nowISO();
  const timestamp = nextISO(resetAt);
  const stampWeek = (week: RoadmapWeek): RoadmapWeek => ({
    ...week,
    updatedAt: timestamp,
    tasks: week.tasks.map((task) => ({ ...task, updatedAt: timestamp })),
  });
  const stampCategory = (category: TechCategory): TechCategory => ({
    ...category,
    updatedAt: timestamp,
    topics: category.topics.map((topic) => ({ ...topic, updatedAt: timestamp })),
  });
  const stampGoal = (goal: Goal): Goal => ({
    ...goal,
    updatedAt: timestamp,
    milestones: goal.milestones.map((milestone) => ({
      ...milestone,
      updatedAt: timestamp,
    })),
  });

  return {
    ...data,
    settings: data.settings,
    roadmap: data.roadmap.map(stampWeek),
    timetable: data.timetable.map((slot) => ({ ...slot, updatedAt: timestamp })),
    dailyLogs: data.dailyLogs,
    techCategories: data.techCategories.map(stampCategory),
    applications: data.applications.map((application) => ({
      ...application,
      updatedAt: timestamp,
    })),
    interviews: data.interviews.map((interview) => ({ ...interview, updatedAt: timestamp })),
    mockInterviews: data.mockInterviews.map((mock) => ({ ...mock, updatedAt: timestamp })),
    tasks: data.tasks.map((task) => ({ ...task, updatedAt: timestamp })),
    goals: data.goals.map(stampGoal),
    companies: data.companies.map((company) => ({ ...company, updatedAt: timestamp })),
    notes: data.notes.map((note) => ({ ...note, updatedAt: timestamp })),
    syncMeta: {
      settingsUpdatedAt: timestamp,
      dailyLogsUpdatedAt: Object.fromEntries(
        Object.keys(data.dailyLogs).map((date) => [date, timestamp]),
      ),
      tombstones: {},
      resetAt,
    },
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      data: createInitialData(),

      updateSettings: (patch) =>
        set((state) => {
          const syncFields = Object.keys(patch).filter((key) => key !== 'theme');
          const timestamp =
            syncFields.length > 0
              ? nextISO(state.data.syncMeta.settingsUpdatedAt)
              : state.data.syncMeta.settingsUpdatedAt;
          return {
            data: {
              ...state.data,
              settings: { ...state.data.settings, ...patch },
              syncMeta: { ...state.data.syncMeta, settingsUpdatedAt: timestamp },
            },
          };
        }),

      resetAllData: () => set({ data: stampAfterReset(createInitialData()) }),

      importData: (incoming, mode) =>
        set((state) => ({
          data:
            mode === 'replace'
              ? stampAfterReset(incoming)
              : unlinkMissingApplications(mergeAppData(state.data, incoming)),
        })),

      applyRemoteData: (data) => set({ data }),

      restoreRoadmap: () =>
        set((state) => {
          const timestamp = nextISO();
          const roadmap = createDefaultRoadmap().map((week) => ({
            ...week,
            updatedAt: timestamp,
            tasks: week.tasks.map((task) => ({ ...task, updatedAt: timestamp })),
          }));
          return {
            data: {
              ...state.data,
              roadmap,
              syncMeta: removeTombstonePrefixes(state.data.syncMeta, [
                'roadmap',
                'roadmapTasks',
              ]),
            },
          };
        }),

      restoreTimetable: () =>
        set((state) => {
          const timestamp = nextISO();
          return {
            data: {
              ...state.data,
              timetable: createDefaultTimetable().map((slot) => ({
                ...slot,
                updatedAt: timestamp,
              })),
              syncMeta: removeTombstonePrefixes(state.data.syncMeta, ['timetable']),
            },
          };
        }),

      updateWeek: (weekId, patch) =>
        set((state) => {
          const week = state.data.roadmap.find((item) => item.id === weekId);
          if (!week) return state;

          const timestamp = nextISO(week.updatedAt);
          const tasks = patch.tasks
            ? patch.tasks.map((task) => ({ ...task, updatedAt: task.updatedAt ?? timestamp }))
            : week.tasks;
          const removedTaskIds = week.tasks
            .filter((task) => !tasks.some((nextTask) => nextTask.id === task.id))
            .map((task) => tombstoneId('roadmapTasks', task.id));
          const syncMeta = removeTombstoneKeys(
            addTombstones(state.data.syncMeta, removedTaskIds, timestamp),
            tasks.map((task) => tombstoneId('roadmapTasks', task.id)),
          );

          return {
            data: {
              ...state.data,
              roadmap: state.data.roadmap.map((item) =>
                item.id === weekId
                  ? {
                      ...item,
                      ...patch,
                      tasks,
                      progress:
                        patch.status === 'Completed'
                          ? 100
                          : patch.progress !== undefined
                            ? clamp(patch.progress)
                            : item.progress,
                      updatedAt: timestamp,
                    }
                  : item,
              ),
              syncMeta,
            },
          };
        }),

      setWeekStatus: (weekId, status) => get().updateWeek(weekId, { status }),

      setWeekProgress: (weekId, progress) => {
        const patch: Partial<RoadmapWeek> = { progress: clamp(progress) };
        if (progress >= 100) patch.status = 'Completed';
        get().updateWeek(weekId, patch);
      },

      addWeekTask: (weekId, title) =>
        set((state) => {
          const week = state.data.roadmap.find((item) => item.id === weekId);
          if (!week) return state;
          const timestamp = nextISO(week.updatedAt);
          const task = {
            id: createId('wtask'),
            title,
            done: false,
            updatedAt: timestamp,
          };
          return {
            data: {
              ...state.data,
              roadmap: state.data.roadmap.map((item) =>
                item.id === weekId
                  ? { ...item, tasks: [...item.tasks, task], updatedAt: timestamp }
                  : item,
              ),
              syncMeta: removeTombstoneKeys(state.data.syncMeta, [
                tombstoneId('roadmapTasks', task.id),
              ]),
            },
          };
        }),

      toggleWeekTask: (weekId, taskId) =>
        set((state) => {
          const week = state.data.roadmap.find((item) => item.id === weekId);
          if (!week) return state;
          const timestamp = nextISO(week.updatedAt);
          return {
            data: {
              ...state.data,
              roadmap: state.data.roadmap.map((item) =>
                item.id === weekId
                  ? {
                      ...item,
                      tasks: item.tasks.map((task) =>
                        task.id === taskId
                          ? { ...task, done: !task.done, updatedAt: timestamp }
                          : task,
                      ),
                      updatedAt: timestamp,
                    }
                  : item,
              ),
            },
          };
        }),

      deleteWeekTask: (weekId, taskId) =>
        set((state) => {
          const week = state.data.roadmap.find((item) => item.id === weekId);
          if (!week) return state;
          const timestamp = nextISO(week.updatedAt);
          return {
            data: {
              ...state.data,
              roadmap: state.data.roadmap.map((item) =>
                item.id === weekId
                  ? {
                      ...item,
                      tasks: item.tasks.filter((task) => task.id !== taskId),
                      updatedAt: timestamp,
                    }
                  : item,
              ),
              syncMeta: addTombstones(
                state.data.syncMeta,
                [tombstoneId('roadmapTasks', taskId)],
                timestamp,
              ),
            },
          };
        }),

      addSlot: (slot) =>
        set((state) => ({
          data: {
            ...state.data,
            timetable: [
              ...state.data.timetable,
              { ...slot, id: createId('slot'), createdAt: nowISO(), updatedAt: nowISO() },
            ],
          },
        })),

      updateSlot: (slotId, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            timetable: state.data.timetable.map((slot) =>
              slot.id === slotId ? touch(slot, patch) : slot,
            ),
          },
        })),

      deleteSlot: (slotId) =>
        set((state) => ({
          data: {
            ...state.data,
            timetable: state.data.timetable.filter((slot) => slot.id !== slotId),
            syncMeta: addTombstones(state.data.syncMeta, [
              tombstoneId('timetable', slotId),
            ]),
          },
        })),

      setSlotStatus: (dateKey, slotId, status) =>
        set((state) => {
          const existing = state.data.dailyLogs[dateKey] ?? { notes: '', statuses: {} };
          const statuses = { ...existing.statuses };
          if (status) statuses[slotId] = status;
          else delete statuses[slotId];
          const timestamp = nextISO(state.data.syncMeta.dailyLogsUpdatedAt[dateKey]);
          return {
            data: {
              ...state.data,
              dailyLogs: {
                ...state.data.dailyLogs,
                [dateKey]: { ...existing, statuses },
              },
              syncMeta: {
                ...state.data.syncMeta,
                dailyLogsUpdatedAt: {
                  ...state.data.syncMeta.dailyLogsUpdatedAt,
                  [dateKey]: timestamp,
                },
              },
            },
          };
        }),

      setDailyNote: (dateKey, notes) =>
        set((state) => {
          const existing = state.data.dailyLogs[dateKey] ?? { notes: '', statuses: {} };
          const timestamp = nextISO(state.data.syncMeta.dailyLogsUpdatedAt[dateKey]);
          return {
            data: {
              ...state.data,
              dailyLogs: {
                ...state.data.dailyLogs,
                [dateKey]: { ...existing, notes },
              },
              syncMeta: {
                ...state.data.syncMeta,
                dailyLogsUpdatedAt: {
                  ...state.data.syncMeta.dailyLogsUpdatedAt,
                  [dateKey]: timestamp,
                },
              },
            },
          };
        }),

      addTopic: (categoryId, topic) =>
        set((state) => ({
          data: {
            ...state.data,
            techCategories: state.data.techCategories.map((category) =>
              category.id === categoryId
                ? touch(category, {
                    topics: [
                      ...category.topics,
                      { ...topic, id: createId('topic'), createdAt: nowISO(), updatedAt: nowISO() },
                    ],
                  })
                : category,
            ),
          },
        })),

      updateTopic: (categoryId, topicId, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            techCategories: state.data.techCategories.map((category) =>
              category.id === categoryId
                ? touch(category, {
                    topics: category.topics.map((topic) =>
                      topic.id === topicId ? touch(topic, patch) : topic,
                    ),
                  })
                : category,
            ),
          },
        })),

      deleteTopic: (categoryId, topicId) =>
        set((state) => {
          const category = state.data.techCategories.find((item) => item.id === categoryId);
          if (!category) return state;
          const timestamp = nextISO(category.updatedAt);
          return {
            data: {
              ...state.data,
              techCategories: state.data.techCategories.map((item) =>
                item.id === categoryId
                  ? {
                      ...item,
                      topics: item.topics.filter((topic) => topic.id !== topicId),
                      updatedAt: timestamp,
                    }
                  : item,
              ),
              syncMeta: addTombstones(
                state.data.syncMeta,
                [tombstoneId('techTopics', topicId)],
                timestamp,
              ),
            },
          };
        }),

      updateCategory: (categoryId, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            techCategories: state.data.techCategories.map((category) =>
              category.id === categoryId ? touch<TechCategory>(category, patch) : category,
            ),
          },
        })),

      addApplication: (application) =>
        set((state) => {
          const now = nowISO();
          return {
            data: {
              ...state.data,
              applications: [
                {
                  ...application,
                  id: createId('app'),
                  createdAt: now,
                  updatedAt: now,
                  history: [
                    {
                      id: createId('history'),
                      date: now,
                      from: null,
                      to: application.stage,
                      note: 'Application created',
                    },
                  ],
                },
                ...state.data.applications,
              ],
            },
          };
        }),

      updateApplication: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            applications: state.data.applications.map((application) => {
              if (application.id !== id) return application;
              const stageChanged = patch.stage && patch.stage !== application.stage;
              return touch(application, {
                ...patch,
                history: stageChanged
                  ? [
                      ...application.history,
                      {
                        id: createId('history'),
                        date: nowISO(),
                        from: application.stage,
                        to: patch.stage as ApplicationStage,
                        note: 'Stage updated',
                      },
                    ]
                  : application.history,
              });
            }),
          },
        })),

      setApplicationStage: (id, stage, note = '') => {
        const application = get().data.applications.find((item) => item.id === id);
        if (!application || application.stage === stage) return;
        set((state) => ({
          data: {
            ...state.data,
            applications: state.data.applications.map((item) =>
              item.id === id
                ? touch(item, {
                    stage,
                    history: [
                      ...item.history,
                      {
                        id: createId('history'),
                        date: nowISO(),
                        from: item.stage,
                        to: stage,
                        note,
                      },
                    ],
                  })
                : item,
            ),
          },
        }));
      },

      deleteApplication: (id) =>
        set((state) => {
          const timestamp = nowISO();
          return {
            data: {
              ...state.data,
              applications: state.data.applications.filter((application) => application.id !== id),
              interviews: state.data.interviews.map((interview) =>
                interview.applicationId === id
                  ? { ...interview, applicationId: '', updatedAt: timestamp }
                  : interview,
              ),
              syncMeta: addTombstones(
                state.data.syncMeta,
                [tombstoneId('applications', id)],
                timestamp,
              ),
            },
          };
        }),

      addInterview: (interview) =>
        set((state) => ({
          data: {
            ...state.data,
            interviews: [
              {
                ...interview,
                id: createId('interview'),
                createdAt: nowISO(),
                updatedAt: nowISO(),
              },
              ...state.data.interviews,
            ],
          },
        })),

      updateInterview: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            interviews: state.data.interviews.map((interview) =>
              interview.id === id ? touch(interview, patch) : interview,
            ),
          },
        })),

      deleteInterview: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            interviews: state.data.interviews.filter((interview) => interview.id !== id),
            syncMeta: addTombstones(state.data.syncMeta, [
              tombstoneId('interviews', id),
            ]),
          },
        })),

      addMock: (mock) =>
        set((state) => ({
          data: {
            ...state.data,
            mockInterviews: [
              { ...mock, id: createId('mock'), createdAt: nowISO(), updatedAt: nowISO() },
              ...state.data.mockInterviews,
            ],
          },
        })),

      updateMock: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            mockInterviews: state.data.mockInterviews.map((mock) =>
              mock.id === id ? touch(mock, patch) : mock,
            ),
          },
        })),

      deleteMock: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            mockInterviews: state.data.mockInterviews.filter((mock) => mock.id !== id),
            syncMeta: addTombstones(state.data.syncMeta, [
              tombstoneId('mockInterviews', id),
            ]),
          },
        })),

      addTask: (task) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: [
              { ...task, id: createId('task'), createdAt: nowISO(), updatedAt: nowISO() },
              ...state.data.tasks,
            ],
          },
        })),

      updateTask: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: state.data.tasks.map((task) => (task.id === id ? touch(task, patch) : task)),
          },
        })),

      deleteTask: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: state.data.tasks.filter((task) => task.id !== id),
            syncMeta: addTombstones(state.data.syncMeta, [tombstoneId('tasks', id)]),
          },
        })),

      toggleTaskStatus: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            tasks: state.data.tasks.map((task) =>
              task.id === id
                ? touch(task, { status: task.status === 'Done' ? 'Todo' : 'Done' })
                : task,
            ),
          },
        })),

      addGoal: (goal) =>
        set((state) => {
          const timestamp = nowISO();
          return {
            data: {
              ...state.data,
              goals: [
                {
                  ...goal,
                  id: createId('goal'),
                  createdAt: timestamp,
                  updatedAt: timestamp,
                  milestones: goal.milestones.map((milestone) => ({
                    ...milestone,
                    updatedAt: milestone.updatedAt ?? timestamp,
                  })),
                },
                ...state.data.goals,
              ],
            },
          };
        }),

      updateGoal: (id, patch) =>
        set((state) => {
          const goal = state.data.goals.find((item) => item.id === id);
          if (!goal) return state;
          const timestamp = nextISO(goal.updatedAt);
          const existingMilestones = new Map(
            goal.milestones.map((milestone) => [milestone.id, milestone]),
          );
          const milestones = patch.milestones
            ? patch.milestones.map((milestone) => {
                const existing = existingMilestones.get(milestone.id);
                const changed =
                  !existing || existing.title !== milestone.title || existing.done !== milestone.done;
                return {
                  ...milestone,
                  updatedAt: changed
                    ? timestamp
                    : existing?.updatedAt ?? goal.updatedAt,
                };
              })
            : goal.milestones;
          const removedMilestoneKeys = goal.milestones
            .filter(
              (milestone) =>
                !milestones.some((nextMilestone) => nextMilestone.id === milestone.id),
            )
            .map((milestone) => tombstoneId('milestones', milestone.id));
          const syncMeta = removeTombstoneKeys(
            addTombstones(state.data.syncMeta, removedMilestoneKeys, timestamp),
            milestones.map((milestone) => tombstoneId('milestones', milestone.id)),
          );

          return {
            data: {
              ...state.data,
              goals: state.data.goals.map((item) =>
                item.id === id
                  ? { ...item, ...patch, milestones, updatedAt: timestamp }
                  : item,
              ),
              syncMeta,
            },
          };
        }),

      deleteGoal: (id) =>
        set((state) => {
          const goal = state.data.goals.find((item) => item.id === id);
          return {
            data: {
              ...state.data,
              goals: state.data.goals.filter((item) => item.id !== id),
              syncMeta: addTombstones(
                state.data.syncMeta,
                [
                  tombstoneId('goals', id),
                  ...(goal?.milestones.map((milestone) =>
                    tombstoneId('milestones', milestone.id),
                  ) ?? []),
                ],
                nowISO(),
              ),
            },
          };
        }),

      toggleMilestone: (goalId, milestoneId) =>
        set((state) => {
          const goal = state.data.goals.find((item) => item.id === goalId);
          if (!goal) return state;
          const timestamp = nextISO(goal.updatedAt);
          return {
            data: {
              ...state.data,
              goals: state.data.goals.map((item) => {
                if (item.id !== goalId) return item;
                const milestones = item.milestones.map((milestone) =>
                  milestone.id === milestoneId
                    ? { ...milestone, done: !milestone.done, updatedAt: timestamp }
                    : milestone,
                );
                const progress = milestones.length
                  ? Math.round(
                      (milestones.filter((milestone) => milestone.done).length /
                        milestones.length) *
                        100,
                    )
                  : item.progress;
                return {
                  ...item,
                  milestones,
                  progress,
                  status:
                    progress >= 100
                      ? 'Completed'
                      : item.status === 'Completed'
                        ? 'In Progress'
                        : item.status,
                  updatedAt: timestamp,
                };
              }),
            },
          };
        }),

      addCompany: (company) =>
        set((state) => ({
          data: {
            ...state.data,
            companies: [
              { ...company, id: createId('company'), createdAt: nowISO(), updatedAt: nowISO() },
              ...state.data.companies,
            ],
          },
        })),

      updateCompany: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            companies: state.data.companies.map((company) =>
              company.id === id ? touch(company, patch) : company,
            ),
          },
        })),

      deleteCompany: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            companies: state.data.companies.filter((company) => company.id !== id),
            syncMeta: addTombstones(state.data.syncMeta, [
              tombstoneId('companies', id),
            ]),
          },
        })),

      addNote: (note) =>
        set((state) => ({
          data: {
            ...state.data,
            notes: [
              { ...note, id: createId('note'), createdAt: nowISO(), updatedAt: nowISO() },
              ...state.data.notes,
            ],
          },
        })),

      updateNote: (id, patch) =>
        set((state) => {
          const notes = state.data.notes.map((note) =>
            note.id === id ? touch(note, patch) : note,
          );
          return {
            data: {
              ...state.data,
              notes: notes.sort((a, b) => Number(b.pinned) - Number(a.pinned)),
            },
          };
        }),

      deleteNote: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            notes: state.data.notes.filter((note) => note.id !== id),
            syncMeta: addTombstones(state.data.syncMeta, [tombstoneId('notes', id)]),
          },
        })),

      toggleNotePin: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            notes: state.data.notes
              .map((note) => (note.id === id ? touch(note, { pinned: !note.pinned }) : note))
              .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createSafePersistStorage<Pick<AppStore, 'data'>>(),
      partialize: (state) => ({ data: state.data }),
      migrate: (persisted, version) => {
        const migrated = migratePersistedState(persisted, version);
        return migrated ?? { data: createInitialData() };
      },
    },
  ),
);
