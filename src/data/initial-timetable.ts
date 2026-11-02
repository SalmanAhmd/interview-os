import type { ActivityCategory, TimetableSlot } from '../types';
import { SYNC_EPOCH } from '../lib/sync/constants';

const NOW = SYNC_EPOCH;

interface SlotSeed {
  id: string;
  dayOfWeek: number;
  title: string;
  category: ActivityCategory;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

const weekdaySlots = (day: number): SlotSeed[] => [
  {
    id: `slot-${day}-concepts`,
    dayOfWeek: day,
    title: 'Technical concepts',
    category: 'Technical Concepts',
    startTime: '20:00',
    endTime: '20:45',
    durationMinutes: 45,
  },
  {
    id: `slot-${day}-coding`,
    dayOfWeek: day,
    title: 'Hands-on coding',
    category: 'Hands-on Coding',
    startTime: '21:00',
    endTime: '21:45',
    durationMinutes: 45,
  },
  {
    id: `slot-${day}-communication`,
    dayOfWeek: day,
    title: 'Interview communication & revision',
    category: 'Interview Communication',
    startTime: '22:00',
    endTime: '22:30',
    durationMinutes: 30,
  },
];

export const initialTimetable: TimetableSlot[] = [
  ...[1, 2, 3, 4, 5].flatMap(weekdaySlots),
  ...([
    {
    id: 'slot-6-system-design',
    dayOfWeek: 6,
    title: 'Frontend system design',
    category: 'System Design',
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 120,
  },
  {
    id: 'slot-6-mock',
    dayOfWeek: 6,
    title: 'Mock interview',
    category: 'Mock Interview',
    startTime: '11:30',
    endTime: '12:30',
    durationMinutes: 60,
  },
  {
    id: 'slot-6-review',
    dayOfWeek: 6,
    title: 'Review & job applications',
    category: 'Review & Applications',
    startTime: '17:00',
    endTime: '18:00',
    durationMinutes: 60,
  },
  {
    id: 'slot-7-dsa',
    dayOfWeek: 7,
    title: 'DSA / machine coding',
    category: 'DSA / Machine Coding',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
  },
  {
    id: 'slot-7-weak-areas',
    dayOfWeek: 7,
    title: 'Weak-area revision',
    category: 'Weak-area Revision',
    startTime: '10:15',
    endTime: '11:15',
    durationMinutes: 60,
  },
  {
    id: 'slot-7-planning',
    dayOfWeek: 7,
    title: 'Applications, referrals & weekly planning',
    category: 'Planning',
    startTime: '17:00',
    endTime: '18:00',
    durationMinutes: 60,
  },
  ] as SlotSeed[]),
].map((slot) => ({
  ...slot,
  createdAt: NOW,
  updatedAt: NOW,
}));
