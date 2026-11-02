import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { Toaster } from '../common/Toaster';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main
          className="mx-auto w-full max-w-7xl px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8 lg:pb-10"
          id="main-content"
        >
          {children}
        </main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  );
}
