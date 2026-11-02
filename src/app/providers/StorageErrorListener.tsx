import { useEffect, useRef } from 'react';
import { STORAGE_EVENT, type StorageIssue } from '../../lib/storage/storage';
import { useToast } from '../../hooks/useToast';

export function StorageErrorListener() {
  const { error, warning } = useToast();
  const lastMessage = useRef<{ message: string; at: number } | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const issue = (event as CustomEvent<StorageIssue>).detail;
      if (!issue) return;
      const now = Date.now();
      if (lastMessage.current?.message === issue.message && now - lastMessage.current.at < 8000) {
        return;
      }
      lastMessage.current = { message: issue.message, at: now };
      if (issue.kind === 'write') {
        error('Could not save changes', { description: issue.message });
      } else {
        warning('Storage notice', { description: issue.message });
      }
    };

    window.addEventListener(STORAGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_EVENT, handler);
  }, [error, warning]);

  return null;
}
