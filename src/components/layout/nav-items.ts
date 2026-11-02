import {
  Building2,
  CalendarRange,
  Clock3,
  Code2,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Mic2,
  NotebookPen,
  Settings,
  Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        description: 'Readiness, momentum and next actions',
      },
    ],
  },
  {
    label: 'Preparation',
    items: [
      {
        label: 'Weekly Roadmap',
        href: '/roadmap',
        icon: CalendarRange,
        description: '22-week preparation plan',
      },
      {
        label: 'Daily Timetable',
        href: '/timetable',
        icon: Clock3,
        description: 'Weekly study schedule',
      },
      {
        label: 'Technical Prep',
        href: '/technical',
        icon: Code2,
        description: 'Skill and confidence tracker',
      },
    ],
  },
  {
    label: 'Job search',
    items: [
      {
        label: 'Applications',
        href: '/applications',
        icon: Briefcase,
        description: 'Pipeline and follow-ups',
      },
      {
        label: 'Interview Log',
        href: '/interviews',
        icon: MessagesSquare,
        description: 'Feedback and outcomes',
      },
      {
        label: 'Mock Interviews',
        href: '/mock-interviews',
        icon: Mic2,
        description: 'Practice scores and trends',
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        label: 'Tasks & Goals',
        href: '/tasks',
        icon: ListChecks,
        description: 'Execution and milestones',
      },
      {
        label: 'Company Research',
        href: '/companies',
        icon: Building2,
        description: 'Target company intelligence',
      },
      {
        label: 'Notes & Resources',
        href: '/notes',
        icon: NotebookPen,
        description: 'Knowledge base',
      },
    ],
  },
];

export const settingsNavItem: NavItem = {
  label: 'Settings',
  href: '/settings',
  icon: Settings,
  description: 'Preferences, data and backup',
};

export const allNavItems = [...navigation.flatMap((section) => section.items), settingsNavItem];

export function getNavItem(pathname: string): NavItem | undefined {
  if (pathname === '/') return allNavItems[0];
  return allNavItems.find((item) => item.href !== '/' && pathname.startsWith(item.href));
}
