import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/input';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { formatDate, INPUT_DATE } from '../../lib/dates';
import { format } from 'date-fns';

export function DailyNoteDialog({
  date,
  onClose,
}: {
  date: Date | null;
  onClose: () => void;
}) {
  const dailyLogs = useAppStore((state) => state.data.dailyLogs);
  const setDailyNote = useAppStore((state) => state.setDailyNote);
  const { success } = useToast();
  const key = date ? format(date, INPUT_DATE) : '';
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (date) setNotes(dailyLogs[key]?.notes ?? '');
  }, [date, key, dailyLogs]);

  const handleSave = () => {
    if (!date) return;
    setDailyNote(key, notes);
    success('Daily note saved', { description: formatDate(date, 'EEEE, d MMMM') });
    onClose();
  };

  return (
    <Dialog
      open={Boolean(date)}
      onClose={onClose}
      title={date ? `Daily note · ${formatDate(date, 'EEE, d MMM')}` : 'Daily note'}
      description="Capture what you studied, how it felt and what to adjust next week."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save note
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <label htmlFor="daily-note" className="text-xs font-medium">
          Notes
        </label>
        <Textarea
          id="daily-note"
          data-autofocus
          rows={7}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What did you complete? What felt difficult? What will you change tomorrow?"
        />
      </div>
    </Dialog>
  );
}
