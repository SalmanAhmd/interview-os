import { Link, useLocation } from 'react-router-dom';
import { Command, Settings, Target, X } from 'lucide-react';
import type { RefObject } from 'react';
import { navigation } from './nav-items';
import { useAppStore } from '../../stores/useAppStore';
import { cn, formatLakhs, getInitials } from '../../lib/utils';
import { daysUntil, formatDate } from '../../lib/dates';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({
  onNavigate,
  closeButtonRef,
}: {
  onNavigate?: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = useLocation().pathname;
  const settings = useAppStore((state) => state.data.settings);
  const targetDays = Math.max(0, daysUntil(settings.targetLwd));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-2.5"
          aria-label="Interview OS home"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Command className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">Interview OS</span>
            <span className="block truncate text-2xs text-muted-foreground">
              Frontend · {formatLakhs(settings.targetCompensation)}+
            </span>
          </span>
        </Link>
        {onNavigate ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onNavigate}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <div className="space-y-6">
          {navigation.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-2xs font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        {active ? (
                          <span
                            className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            active ? 'text-foreground' : 'text-muted-foreground/80',
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <Link
          to="/settings"
          onClick={onNavigate}
          aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors',
            isActive(pathname, '/settings')
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </Link>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Target LWD
            </span>
            <Target className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tracking-tight tabular-nums">{targetDays}</span>
            <span className="text-2xs text-muted-foreground">days left</span>
          </div>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            {formatDate(settings.targetLwd, 'd MMM yyyy')} · {formatLakhs(settings.targetCompensation)}+
          </p>
        </div>

        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/60"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xs font-semibold text-accent">
            {getInitials(settings.userName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">{settings.userName}</span>
            <span className="block truncate text-2xs text-muted-foreground">
              Senior Lead Frontend Developer
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card/60 backdrop-blur-sm lg:block">
      <SidebarContent />
    </aside>
  );
}
