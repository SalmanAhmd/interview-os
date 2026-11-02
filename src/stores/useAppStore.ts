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
  Task,
  TechCategory,
  TechTopic,
  TimetableSlot,
  WeekStatus,
} from '../types';
import { clamp, createId, nowISO } from '../lib/utils';
import { createSafePersistStorage, migratePersistedState, STORAGE_KEY } from '../lib/storage/storage';
import { mergeAppData, type ImportMode } from '../lib/storage/backup';

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
  updatedAt: nowISO(),
});

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      data: createInitialData(),

      updateSettings: (patch) =>
        set((state) => ({ data: { ...state.data, settings: { ...state.data.settings, ...patch } } })),

      resetAllData: () => set({ data: createInitialData() }),

      importData: (incoming, mode) =>
        set((state) => ({
          data: mode === 'replace' ? incoming : mergeAppData(state.data, incoming),
        })),

      restoreRoadmap: () =>
        set((state) => ({ data: { ...state.data, roadmap: createDefaultRoadmap() } })),

      restoreTimetable: () =>
        set((state) => ({ data: { ...state.data, timetable: createDefaultTimetable() } })),

      updateWeek: (weekId, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            roadmap: state.data.roadmap.map((week) =>
              week.id === weekId
                ? touch(week, {
                    ...patch,
                    progress:
                      patch.status === 'Completed'
                        ? 100
                        : patch.progress !== undefined
                          ? clamp(patch.progress)
                          : week.progress,
                  })
                : week,
            ),
          },
        })),

      setWeekStatus: (weekId, status) => get().updateWeek(weekId, { status }),

      setWeekProgress: (weekId, progress) => {
        const patch: Partial<RoadmapWeek> = { progress: clamp(progress) };
        if (progress >= 100) patch.status = 'Completed';
        get().updateWeek(weekId, patch);
      },

      addWeekTask: (weekId, title) =>
        set((state) => ({
          data: {
            ...state.data,
            roadmap: state.data.roadmap.map((week) =>
              week.id === weekId
                ? touch(week, {
                    tasks: [
                      ...week.tasks,
                      { id: createId('wtask'), title, done: false },
                    ],
                  })
                : week,
            ),
          },
        })),

      toggleWeekTask: (weekId, taskId) =>
        set((state) => ({
          data: {
            ...state.data,
            roadmap: state.data.roadmap.map((week) =>
              week.id === weekId
                ? touch(week, {
                    tasks: week.tasks.map((task) =>
                      task.id === taskId ? { ...task, done: !task.done } : task,
                    ),
                  })
                : week,
            ),
          },
        })),

      deleteWeekTask: (weekId, taskId) =>
        set((state) => ({
          data: {
            ...state.data,
            roadmap: state.data.roadmap.map((week) =>
              week.id === weekId
                ? touch(week, { tasks: week.tasks.filter((task) => task.id !== taskId) })
                : week,
            ),
          },
        })),

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
          },
        })),

      setSlotStatus: (dateKey, slotId, status) =>
        set((state) => {
          const existing = state.data.dailyLogs[dateKey] ?? { notes: '', statuses: {} };
          const statuses = { ...existing.statuses };
          if (status) statuses[slotId] = status;
          else delete statuses[slotId];
          return {
            data: {
              ...state.data,
              dailyLogs: {
                ...state.data.dailyLogs,
                [dateKey]: { ...existing, statuses },
              },
            },
          };
        }),

      setDailyNote: (dateKey, notes) =>
        set((state) => {
          const existing = state.data.dailyLogs[dateKey] ?? { notes: '', statuses: {} };
          return {
            data: {
              ...state.data,
              dailyLogs: {
                ...state.data.dailyLogs,
                [dateKey]: { ...existing, notes },
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
        set((state) => ({
          data: {
            ...state.data,
            techCategories: state.data.techCategories.map((category) =>
              category.id === categoryId
                ? touch(category, {
                    topics: category.topics.filter((topic) => topic.id !== topicId),
                  })
                : category,
            ),
          },
        })),

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
        set((state) => ({
          data: {
            ...state.data,
            applications: state.data.applications.filter((application) => application.id !== id),
            interviews: state.data.interviews.map((interview) =>
              interview.applicationId === id ? touch(interview, { applicationId: '' }) : interview,
            ),
          },
        })),

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
          data: { ...state.data, tasks: state.data.tasks.filter((task) => task.id !== id) },
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
        set((state) => ({
          data: {
            ...state.data,
            goals: [
              { ...goal, id: createId('goal'), createdAt: nowISO(), updatedAt: nowISO() },
              ...state.data.goals,
            ],
          },
        })),

      updateGoal: (id, patch) =>
        set((state) => ({
          data: {
            ...state.data,
            goals: state.data.goals.map((goal) => (goal.id === id ? touch(goal, patch) : goal)),
          },
        })),

      deleteGoal: (id) =>
        set((state) => ({
          data: { ...state.data, goals: state.data.goals.filter((goal) => goal.id !== id) },
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((state) => ({
          data: {
            ...state.data,
            goals: state.data.goals.map((goal) => {
              if (goal.id !== goalId) return goal;
              const milestones = goal.milestones.map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, done: !milestone.done } : milestone,
              );
              const progress = milestones.length
                ? Math.round((milestones.filter((milestone) => milestone.done).length / milestones.length) * 100)
                : goal.progress;
              return touch(goal, {
                milestones,
                progress,
                status: progress >= 100 ? 'Completed' : goal.status === 'Completed' ? 'In Progress' : goal.status,
              });
            }),
          },
        })),

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
          data: { ...state.data, notes: state.data.notes.filter((note) => note.id !== id) },
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
