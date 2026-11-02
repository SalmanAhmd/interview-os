import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, PencilLine, Save } from 'lucide-react';
import type { Note } from '../../types';
import { NOTE_CATEGORIES } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../../hooks/useToast';
import { Dialog } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Field, FormGrid } from '../../components/ui/field';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/input';
import { Tabs } from '../../components/ui/tabs';
import { Markdown } from '../../components/common/Markdown';
import { parseTags } from '../../lib/utils';

const noteSchema = z.object({
  title: z.string().trim().min(2, 'Add a note title.'),
  category: z.enum(NOTE_CATEGORIES),
  tags: z.string(),
  pinned: z.boolean(),
  content: z.string(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

function toDefaults(note: Note | null): NoteFormValues {
  return {
    title: note?.title ?? '',
    category: note?.category ?? 'General',
    tags: note?.tags.join(', ') ?? '',
    pinned: note?.pinned ?? false,
    content: note?.content ?? '',
  };
}

export function NoteEditorDialog({
  open,
  onClose,
  note,
}: {
  open: boolean;
  onClose: () => void;
  note: Note | null;
}) {
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const { success } = useToast();
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: toDefaults(note),
  });

  useEffect(() => {
    if (open) {
      reset(toDefaults(note));
      setMode('write');
    }
  }, [open, note, reset]);

  const content = watch('content');

  const onSubmit = (values: NoteFormValues) => {
    const payload = {
      title: values.title.trim(),
      category: values.category,
      tags: parseTags(values.tags),
      pinned: values.pinned,
      content: values.content,
    };
    if (note) {
      updateNote(note.id, payload);
      success('Note updated', { description: values.title });
    } else {
      addNote(payload);
      success('Note created', { description: values.title });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={note ? 'Edit note' : 'New note'}
      description="Markdown is supported: headings, lists, code blocks, links, bold and italics."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="note-form" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            {note ? 'Save note' : 'Create note'}
          </Button>
        </>
      }
    >
      <form id="note-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormGrid>
          <Field label="Title" htmlFor="note-title" error={errors.title?.message} required>
            <Input
              id="note-title"
              data-autofocus
              {...register('title')}
              placeholder="e.g. React reconciliation interview answer"
              aria-invalid={!!errors.title}
            />
          </Field>
          <Field label="Category" htmlFor="note-category">
            <Select id="note-category" {...register('category')}>
              {NOTE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tags" htmlFor="note-tags" hint="Comma separated">
            <Input id="note-tags" {...register('tags')} placeholder="react, hooks, performance" />
          </Field>
          <div className="flex items-end pb-1.5">
            <label htmlFor="note-pinned" className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <Checkbox id="note-pinned" {...register('pinned')} />
              Pin this note to the top
            </label>
          </div>
        </FormGrid>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Content</span>
            <Tabs
              items={[
                { value: 'write', label: 'Write', icon: <PencilLine className="h-3.5 w-3.5" /> },
                { value: 'preview', label: 'Preview', icon: <Eye className="h-3.5 w-3.5" /> },
              ]}
              value={mode}
              onChange={(value) => setMode(value as 'write' | 'preview')}
              ariaLabel="Note editor mode"
            />
          </div>
          {mode === 'write' ? (
            <Textarea
              id="note-content"
              rows={14}
              {...register('content')}
              placeholder={'## Key idea\n\nExplain it in your own words…\n\n- Trade-off\n- Example'}
              className="font-mono text-xs"
            />
          ) : (
            <div className="min-h-[280px] rounded-md border border-border bg-muted/10 px-4 py-3">
              <Markdown content={content} />
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}
