import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUiStore, type ToastVariant } from '../../stores/useUiStore';
import { cn } from '../../lib/utils';

const variantConfig: Record<
  ToastVariant,
  { icon: typeof Info; className: string; iconClass: string }
> = {
  default: { icon: Info, className: 'border-border', iconClass: 'text-muted-foreground' },
  success: { icon: CheckCircle2, className: 'border-success/25', iconClass: 'text-success' },
  error: { icon: XCircle, className: 'border-danger/30', iconClass: 'text-danger' },
  warning: { icon: AlertTriangle, className: 'border-warning/30', iconClass: 'text-warning' },
};

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const config = variantConfig[toast.variant];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-card p-3.5 shadow-popover animate-in',
              config.className,
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-5">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="-mr-1 -mt-1 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
