import { useMemo, useState } from 'react';
import { addWeeks, format, subWeeks } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ui/dialog';
import type { TimetableSlot } from '../../types';
import { getWeekDates, INPUT_DATE } from '../../lib/dates';
import { getDayStudyStats, getWeekStudyStats, summarizeWeek } from '../../lib/analytics/timetable';
import { formatDuration } from '../../lib/utils';
import { DayColumn } from './DayColumn';
import { SlotFormDialog } from './SlotFormDialog';
import { DailyNoteDialog } from './DailyNoteDialog';

export default function TimetablePage() {
  const data = useAppStore((state) => state.data);
  const deleteSlot = useAppStore((state) => state.deleteSlot);
  const restoreTimetable = useAppStore((state) => state.restoreTimetable);
  const { success } = useToast();
  const [reference, setReference] = useState(new Date());
  const [slotDialog, setSlotDialog] = useState<{ open: boolean; slot: TimetableSlot | null; day: number }>({
    open: false,
    slot: null,
    day: 1,
  });
  const [noteDate, setNoteDate] = useState<Date | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  const weekDates = getWeekDates(reference);
  const weekStats = getWeekStudyStats(data, reference);
  const summary = summarizeWeek(weekStats);
  const dailyStats = weekDates.map((date) => ({
    date,
    stats: getDayStudyStats(data, date),
  }));

  const weekRange = useMemo(
    () => `${format(weekDates[0], 'd MMM')} – ${format(weekDates[6], 'd MMM yyyy')}`,
    [weekDates],
  );

  const handleAdd = (day: number) => {
    setSlotDialog({ open: true, slot: null, day });
  };

  const handleEdit = (slot: TimetableSlot) => {
    setSlotDialog({ open: true, slot, day: slot.dayOfWeek });
  };

  const handleDelete = () => {
    if (!slotToDelete) return;
    deleteSlot(slotToDelete.id);
    success('Activity removed', { description: slotToDelete.title });
    setSlotToDelete(null);
  };

  const handleRestore = () => {
    restoreTimetable();
    success('Default timetable restored', { description: 'Weekday and weekend defaults applied.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily execution"
        title="Daily timetable"
        description="Edit your week plan per activity. Tick off completions, skip dates or reschedule activities as priorities change."
        actions={
          <>
            <Button variant="outline" onClick={() => setReference(new Date())}>
              <Target className="h-4 w-4" />
              This week
            </Button>
            <Button variant="outline" onClick={handleRestore}>
              <RefreshCw className="h-4 w-4" />
              Restore defaults
            </Button>
            <Button onClick={() => handleAdd(new Date().getDay() === 0 ? 7 : new Date().getDay())}>
              <Plus className="h-4 w-4" />
              Add activity
            </Button>
          </>
        }
      />

      <section aria-label="Weekly study summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planned this week"
          value={formatDuration(summary.plannedMinutes)}
          hint={`${summary.totalSlots} activities scheduled`}
          icon={CalendarDays}
        />
        <StatCard
          label="Completed this week"
          value={formatDuration(summary.completedMinutes)}
          hint={`${summary.completion}% of non-skipped activities`}
          icon={Clock3}
        />
        <StatCard
          label="Done / skipped"
          value={`${summary.doneSlots} / ${summary.skippedSlots}`}
          hint="Across all scheduled activities"
          icon={Clock3}
        />
        <StatCard
          label="Daily goal"
          value={`${data.settings.dailyStudyGoalHours}h`}
          hint={weekRange}
          icon={Target}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setReference((current) => subWeeks(current, 1))}
            aria-label="Previous week"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setReference((current) => addWeeks(current, 1))}
            aria-label="Next week"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm font-medium">{weekRange}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tick to complete. Skip a single day without deleting the recurring activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {dailyStats.map(({ date, stats }) => (
          <DayColumn
            key={format(date, INPUT_DATE)}
            date={date}
            stats={stats}
            log={data.dailyLogs[format(date, INPUT_DATE)]}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={setSlotToDelete}
            onOpenNote={setNoteDate}
          />
        ))}
      </div>

      <SlotFormDialog
        open={slotDialog.open}
        onClose={() => setSlotDialog((current) => ({ ...current, open: false }))}
        slot={slotDialog.slot}
        defaultDay={slotDialog.day}
      />

      <DailyNoteDialog date={noteDate} onClose={() => setNoteDate(null)} />

      <ConfirmDialog
        open={Boolean(slotToDelete)}
        title="Delete this activity?"
        description={`"${slotToDelete?.title}" will be removed from the timetable for all future weeks. Past completions remain in history.`}
        confirmLabel="Delete activity"
        onCancel={() => setSlotToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
