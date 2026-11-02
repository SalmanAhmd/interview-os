import { useCallback, useMemo } from 'react';
import { useUiStore, type ToastVariant } from '../stores/useUiStore';

interface ToastOptions {
  description?: string;
  duration?: number;
}

export function useToast() {
  const addToast = useUiStore((state) => state.addToast);

  const toast = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast({ title, description: options?.description, duration: options?.duration }),
    [addToast],
  );

  const notify = useCallback(
    (variant: ToastVariant, title: string, options?: ToastOptions) =>
      addToast({ title, description: options?.description, variant, duration: options?.duration }),
    [addToast],
  );

  return useMemo(
    () => ({
      toast,
      success: (title: string, options?: ToastOptions) => notify('success', title, options),
      error: (title: string, options?: ToastOptions) => notify('error', title, options),
      warning: (title: string, options?: ToastOptions) => notify('warning', title, options),
    }),
    [notify, toast],
  );
}
