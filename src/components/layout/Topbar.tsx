import { Link, useLocation } from 'react-router-dom';
import { Menu, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { getNavItem } from './nav-items';
import { useAppStore } from '../../stores/useAppStore';
import { useUiStore } from '../../stores/useUiStore';
import { formatDate } from '../../lib/dates';
import { Button } from '../ui/button';

export function Topbar() {
  const pathname = useLocation().pathname;
  const current = getNavItem(pathname);
  const theme = useAppStore((state) => state.data.settings.theme);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-xs">
            <li className="hidden text-muted-foreground sm:block">
              <span>Career transition</span>
            </li>
            <li className="hidden text-muted-foreground sm:block" aria-hidden="true">
              /
            </li>
            <li className="truncate font-medium text-foreground" aria-current="page">
              {current?.label ?? 'Not found'}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="mr-1 hidden text-2xs text-muted-foreground md:block">
          {formatDate(new Date(), 'EEE, d MMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => updateSettings({ theme: nextTheme })}
          aria-label={`Theme is ${theme}. Switch to ${nextTheme} theme.`}
          title={`Theme: ${theme} · switch to ${nextTheme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
        <Link
          to="/settings"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
