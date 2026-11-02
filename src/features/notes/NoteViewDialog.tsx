import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import type { Note } from '../../types';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Markdown } from '../../components/common/Markdown';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../lib/dates';

export function NoteViewDialog({
  note,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  const toggleNotePin = useAppStore((state) => state.toggleNotePin);
  const { success } = useToast();

  if (!note) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={note.title}
      description={`${note.category} · updated ${formatDateTime(note.updatedAt)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onDelete(note)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toggleNotePin(note.id);
              success(note.pinned ? 'Note unpinned' : 'Note pinned', { description: note.title });
            }}
          >
            {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {note.pinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button onClick={() => onEdit(note)}>
            <Pencil className="h-4 w-4" />
            Edit note
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="info">{note.category}</Badge>
          {note.pinned ? <Badge tone="success">Pinned</Badge> : null}
          {note.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <Markdown content={note.content} />
        </div>
      </div>
    </Dialog>
  );
}
