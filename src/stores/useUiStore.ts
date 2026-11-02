import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface UiStore {
  toasts: ToastItem[];
  mobileNavOpen: boolean;
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  setMobileNavOpen: (open: boolean) => void;
}

let toastCounter = 0;

export const useUiStore = create<UiStore>()((set, get) => ({
  toasts: [],
  mobileNavOpen: false,

  addToast: (toast) => {
    toastCounter += 1;
    const id = `toast-${Date.now()}-${toastCounter}`;
    const item: ToastItem = {
      id,
      title: toast.title,
      description: toast.description,
      variant: toast.variant ?? 'default',
    };
    set((state) => ({ toasts: [...state.toasts.slice(-3), item] }));
    window.setTimeout(() => {
      if (get().toasts.some((existing) => existing.id === id)) {
        get().removeToast(id);
      }
    }, toast.duration ?? 4200);
    return id;
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
