import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
} from 'lucide-react';
import { useUiStore } from '../../stores/useUiStore';
import { cn } from '../../lib/utils';
import { SidebarContent } from './Sidebar';

const bottomItems = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Roadmap', href: '/roadmap', icon: CalendarRange },
  { label: 'Applications', href: '/applications', icon: Briefcase },
  { label: 'Tasks', href: '/tasks', icon: ListChecks },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = useLocation().pathname;
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => closeRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, setOpen]);

  const isMoreActive = !bottomItems.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Mobile navigation"
      >
        <ul className="grid grid-cols-5">
          {bottomItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 text-2xs transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span>{item.label}</span>
                  {active ? <span className="mt-0.5 h-0.5 w-4 rounded-full bg-accent" /> : null}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-navigation-drawer"
              className={cn(
                'flex h-14 w-full flex-col items-center justify-center gap-0.5 text-2xs transition-colors',
                isMoreActive || open ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>More</span>
              {isMoreActive ? <span className="mt-0.5 h-0.5 w-4 rounded-full bg-accent" /> : null}
            </button>
          </li>
        </ul>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
            onMouseDown={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] border-r border-border bg-card shadow-popover animate-slide-up"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="sr-only"
              tabIndex={-1}
            >
              Close navigation
            </button>
            <SidebarContent
              onNavigate={() => setOpen(false)}
              closeButtonRef={closeRef}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
