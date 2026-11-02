import {
  addDays,
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns';
import type { RoadmapWeek, TimetableSlot } from '../types';

export const DISPLAY_DATE = 'd MMM yyyy';
export const DISPLAY_DATE_LONG = 'EEEE, d MMMM yyyy';
export const INPUT_DATE = 'yyyy-MM-dd';

export function todayISO(): string {
  return format(new Date(), INPUT_DATE);
}

export function toDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(value: string | Date | undefined | null, pattern = DISPLAY_DATE): string {
  const date = toDate(value);
  if (!date) return '—';
  return format(date, pattern);
}

export function formatDateTime(value: string | undefined | null): string {
  const date = toDate(value);
  if (!date) return '—';
  return format(date, "d MMM yyyy, h:mm a");
}

export function relativeTime(value: string | undefined | null): string {
  const date = toDate(value);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function daysUntil(value: string | Date | undefined | null, from = new Date()): number {
  const date = toDate(value);
  if (!date) return 0;
  return differenceInCalendarDays(date, from);
}

export function isPastDate(value: string | undefined | null): boolean {
  const date = toDate(value);
  if (!date) return false;
  return differenceInCalendarDays(date, new Date()) < 0;
}

export function isToday(value: string | undefined | null): boolean {
  const date = toDate(value);
  if (!date) return false;
  return differenceInCalendarDays(date, new Date()) === 0;
}

export function getDayOfWeek(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function getWeekDates(reference = new Date()): Date[] {
  const monday = startOfWeek(reference, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getWeekForDate(roadmap: RoadmapWeek[], reference = new Date()): RoadmapWeek | undefined {
  if (!roadmap.length) return undefined;
  const key = format(reference, INPUT_DATE);
  const match = roadmap.find((week) => key >= week.startDate && key <= week.endDate);
  if (match) return match;
  if (key < roadmap[0].startDate) return roadmap[0];
  return roadmap[roadmap.length - 1];
}

export function getNextWeek(roadmap: RoadmapWeek[], currentNumber: number): RoadmapWeek | undefined {
  return roadmap.find((week) => week.number === currentNumber + 1);
}

export function getPreviousWeek(roadmap: RoadmapWeek[], currentNumber: number): RoadmapWeek | undefined {
  return roadmap.find((week) => week.number === currentNumber - 1);
}

export function formatTime(time: string): string {
  const [hoursValue, minutesValue] = time.split(':').map(Number);
  if (!Number.isFinite(hoursValue) || !Number.isFinite(minutesValue)) return time;
  const suffix = hoursValue >= 12 ? 'PM' : 'AM';
  const hours = hoursValue % 12 || 12;
  return `${hours}:${String(minutesValue).padStart(2, '0')} ${suffix}`;
}

export function minutesBetween(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if ([startHour, startMinute, endHour, endMinute].some((part) => !Number.isFinite(part))) return 0;
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  return end - start;
}

export function slotsForDay(slots: TimetableSlot[], date: Date): TimetableSlot[] {
  const day = getDayOfWeek(date);
  return slots
    .filter((slot) => slot.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getWeekLabel(week: RoadmapWeek): string {
  return `${formatDate(week.startDate, 'd MMM')} – ${formatDate(week.endDate, 'd MMM yyyy')}`;
}

export function getDayLabel(date: Date): string {
  return format(date, 'EEE');
}

export function isSameISODate(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
