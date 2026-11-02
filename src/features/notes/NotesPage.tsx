import { useMemo, useState } from 'react';
import {
  NotebookPen,
  Pencil,
  Pin,
  Plus,
  SearchX,
  Tag,
  Trash2,
} from 'lucide-react';
import type { Note, NoteCategory } from '../../types';
import { NOTE_CATEGORIES } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput } from '../../components/common/SearchInput';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { EmptyState } from '../../components/ui/empty-state';
import { ConfirmDialog } from '../../components/ui/dialog';
import { formatDate } from '../../lib/dates';
import { truncate } from '../../lib/utils';
import { NoteEditorDialog } from './NoteEditorDialog';
import { NoteViewDialog } from './NoteViewDialog';

export default function NotesPage() {
  const data = useAppStore((state) => state.data);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const toggleNotePin = useAppStore((state) => state.toggleNotePin);
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'All'>('All');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [detail, setDetail] = useState<Note | null>(null);
  const [toDelete, setToDelete] = useState<Note | null>(null);

  const notes = data.notes;
  const pinned = notes.filter((note) => note.pinned).length;
  const categoriesUsed = new Set(notes.map((note) => note.category)).size;
  const allTags = new Set(notes.flatMap((note) => note.tags));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (pinnedOnly && !note.pinned) return false;
        if (categoryFilter !== 'All' && note.category !== categoryFilter) return false;
        if (!query) return true;
        return [note.title, note.content, note.tags.join(' '), note.category]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, search, categoryFilter, pinnedOnly]);

  const tabs = [
    { value: 'All', label: 'All', count: notes.length },
    ...NOTE_CATEGORIES.map((category) => ({
      value: category,
      label: category,
      count: notes.filter((note) => note.category === category).length,
    })),
  ];

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (note: Note) => {
    setDetail(null);
    setEditing(note);
    setEditorOpen(true);
  };

  const openNote = (note: Note) => {
    const current = notes.find((item) => item.id === note.id) ?? note;
    setDetail(current);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge base"
        title="Notes & resources"
        description="Write your own explanations, capture interview questions and keep references one search away. Markdown supported."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            New note
          </Button>
        }
      />

      <section aria-label="Notes summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Notes" value={notes.length} hint={`${categoriesUsed} categories used`} icon={NotebookPen} />
        <StatCard label="Pinned" value={pinned} hint="Always at the top of the list" icon={Pin} />
        <StatCard label="Tags" value={allTags.size} hint="Across all notes" icon={Tag} />
        <StatCard label="Recently updated" value={notes.length ? formatDate([...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt, 'd MMM') : '—'} hint={notes.length ? truncate([...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.title ?? '', 34) : 'Start your knowledge base'} icon={Pencil} />
      </section>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs items={tabs} value={categoryFilter} onChange={(value) => setCategoryFilter(value as NoteCategory | 'All')} ariaLabel="Filter notes by category" className="w-full xl:w-auto" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setPinnedOnly((value) => !value)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
              pinnedOnly ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
            aria-pressed={pinnedOnly}
          >
            <Pin className="h-3.5 w-3.5" />
            Pinned only
          </button>
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes, tags, content…" ariaLabel="Search notes" className="w-full sm:w-72" />
        </div>
      </div>

      {filtered.length ? (
        <section aria-label="Notes" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((note) => {
            const preview = truncate(
              note.content
                .replace(/[#>*`_~-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
              180,
            );
            return (
              <Card key={note.id} className="group flex flex-col p-4 transition-colors hover:border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => openNote(note)} className="min-w-0 text-left">
                    <h2 className="text-sm font-semibold leading-5 hover:text-accent">{note.title}</h2>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {note.category} · {formatDate(note.updatedAt, 'd MMM')}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleNotePin(note.id);
                        success(note.pinned ? 'Note unpinned' : 'Note pinned', { description: note.title });
                      }}
                      className={`rounded p-1.5 transition-colors hover:bg-muted ${note.pinned ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
                    >
                      <Pin className={`h-3.5 w-3.5 ${note.pinned ? 'fill-current' : ''}`} />
                    </button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(note)} aria-label={`Edit ${note.title}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(note)} aria-label={`Delete ${note.title}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <button type="button" onClick={() => openNote(note)} className="mt-2 flex-1 text-left">
                  <p className="line-clamp-3 text-2xs leading-4 text-muted-foreground">
                    {preview || 'This note is empty. Open it to start writing.'}
                  </p>
                </button>

                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {note.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} tone="neutral">
                      #{tag}
                    </Badge>
                  ))}
                  {note.tags.length > 4 ? <Badge tone="outline">+{note.tags.length - 4}</Badge> : null}
                  {note.pinned ? <Badge tone="success">Pinned</Badge> : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-2xs text-muted-foreground">
                    {note.content.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <Button variant="link" size="sm" onClick={() => openNote(note)}>
                    Open note
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyState
          icon={search || categoryFilter !== 'All' || pinnedOnly ? SearchX : NotebookPen}
          title={search || categoryFilter !== 'All' || pinnedOnly ? 'No notes match' : 'No notes yet'}
          description={
            search || categoryFilter !== 'All' || pinnedOnly
              ? 'Clear the filters or try a different search term.'
              : 'Write your first note: a React explanation, a tricky interview question or a system design trade-off.'
          }
          action={
            search || categoryFilter !== 'All' || pinnedOnly ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('All');
                  setPinnedOnly(false);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                New note
              </Button>
            )
          }
        />
      )}

      <NoteEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} note={editing} />
      <NoteViewDialog
        note={detail}
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={setToDelete}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this note?"
        description={`"${toDelete?.title ?? 'This note'}" will be permanently removed from your knowledge base.`}
        confirmLabel="Delete note"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteNote(toDelete.id);
            success('Note deleted', { description: toDelete.title });
          }
          setToDelete(null);
          setDetail(null);
        }}
      />
    </div>
  );
}
