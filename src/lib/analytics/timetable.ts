import { format } from 'date-fns';
import type { AppData, SlotStatus, TimetableSlot } from '../../types';
import { getWeekDates, INPUT_DATE, slotsForDay } from '../dates';
import { percent } from '../utils';

export interface DayStudyStats {
  dateKey: string;
  dayLabel: string;
  date: Date;
  plannedMinutes: number;
  completedMinutes: number;
  totalSlots: number;
  doneSlots: number;
  skippedSlots: number;
  completion: number;
  slots: TimetableSlot[];
}

export function getSlotStatus(
  data: AppData,
  dateKey: string,
  slotId: string,
): SlotStatus | undefined {
  return data.dailyLogs[dateKey]?.statuses?.[slotId];
}

export function getDayStudyStats(data: AppData, date: Date): DayStudyStats {
  const dateKey = format(date, INPUT_DATE);
  const slots = slotsForDay(data.timetable, date);
  const log = data.dailyLogs[dateKey];
  const doneSlots = slots.filter((slot) => log?.statuses?.[slot.id] === 'done');
  const skippedSlots = slots.filter((slot) => log?.statuses?.[slot.id] === 'skipped');
  const activeSlots = slots.length - skippedSlots.length;

  return {
    dateKey,
    dayLabel: format(date, 'EEE'),
    date,
    plannedMinutes: slots.reduce((sum, slot) => sum + slot.durationMinutes, 0),
    completedMinutes: doneSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0),
    totalSlots: slots.length,
    doneSlots: doneSlots.length,
    skippedSlots: skippedSlots.length,
    completion: percent(doneSlots.length, activeSlots),
    slots,
  };
}

export function getWeekStudyStats(data: AppData, reference = new Date()): DayStudyStats[] {
  return getWeekDates(reference).map((date) => getDayStudyStats(data, date));
}

export function summarizeWeek(days: DayStudyStats[]) {
  const plannedMinutes = days.reduce((sum, day) => sum + day.plannedMinutes, 0);
  const completedMinutes = days.reduce((sum, day) => sum + day.completedMinutes, 0);
  const totalSlots = days.reduce((sum, day) => sum + day.totalSlots, 0);
  const doneSlots = days.reduce((sum, day) => sum + day.doneSlots, 0);
  const skippedSlots = days.reduce((sum, day) => sum + day.skippedSlots, 0);

  return {
    plannedMinutes,
    completedMinutes,
    totalSlots,
    doneSlots,
    skippedSlots,
    completion: percent(doneSlots, totalSlots - skippedSlots),
  };
}

export function getStudyStreak(data: AppData, maxDays = 60): number {
  let streak = 0;
  const today = new Date();
  for (let offset = 0; offset < maxDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const stats = getDayStudyStats(data, date);
    if (stats.totalSlots === 0) continue;
    if (stats.doneSlots > 0) streak += 1;
    else break;
  }
  return streak;
}
