import type { AppData, Settings } from '../types';
import { initialRoadmap } from './initial-roadmap';
import { initialTimetable } from './initial-timetable';
import { initialGoals } from './initial-goals';
import { initialTechCategories } from './initial-technical';

export const SCHEMA_VERSION = 1;

export const defaultSettings: Settings = {
  userName: 'Salman',
  theme: 'system',
  defaultStudyDuration: 45,
  dailyStudyGoalHours: 2,
  targetCompensation: 5_000_000,
  prepStartDate: '2026-11-02',
  plannedResignationDate: '2026-12-31',
  noticePeriodDays: 90,
  targetLwd: '2027-03-31',
  preferredLocations: ['Mumbai', 'Remote (India)'],
  preferredRoles: [
    'Senior Frontend Engineer',
    'Senior Software Engineer – Frontend',
    'Lead Frontend Engineer (IC)',
    'Frontend Architect',
  ],
};

export function createInitialData(): AppData {
  return {
    settings: structuredClone(defaultSettings),
    roadmap: structuredClone(initialRoadmap),
    timetable: structuredClone(initialTimetable),
    dailyLogs: {},
    techCategories: structuredClone(initialTechCategories),
    applications: [],
    interviews: [],
    mockInterviews: [],
    tasks: [],
    goals: structuredClone(initialGoals),
    companies: [],
    notes: [],
  };
}

export function createDefaultRoadmap() {
  return structuredClone(initialRoadmap);
}

export function createDefaultTimetable() {
  return structuredClone(initialTimetable);
}
