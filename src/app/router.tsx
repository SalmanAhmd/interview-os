import type { ReactNode } from 'react';
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from './providers/ThemeProvider';
import { StorageErrorListener } from './providers/StorageErrorListener';
import { AppShell } from '../components/layout/AppShell';
import { PageSkeleton } from '../components/ui/skeleton';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const RoadmapPage = lazy(() => import('../features/roadmap/RoadmapPage'));
const TimetablePage = lazy(() => import('../features/timetable/TimetablePage'));
const TechnicalPage = lazy(() => import('../features/technical/TechnicalPage'));
const ApplicationsPage = lazy(() => import('../features/applications/ApplicationsPage'));
const InterviewsPage = lazy(() => import('../features/interviews/InterviewsPage'));
const MockInterviewsPage = lazy(() => import('../features/mock-interviews/MockInterviewsPage'));
const TasksPage = lazy(() => import('../features/tasks/TasksPage'));
const CompaniesPage = lazy(() => import('../features/companies/CompaniesPage'));
const NotesPage = lazy(() => import('../features/notes/NotesPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('../features/not-found/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function Shell() {
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HashRouter>
          <StorageErrorListener />
          <ScrollToTop />
          <Routes>
            <Route element={<Shell />}>
              <Route
                index
                element={
                  <Page>
                    <DashboardPage />
                  </Page>
                }
              />
              <Route
                path="roadmap"
                element={
                  <Page>
                    <RoadmapPage />
                  </Page>
                }
              />
              <Route
                path="timetable"
                element={
                  <Page>
                    <TimetablePage />
                  </Page>
                }
              />
              <Route
                path="technical"
                element={
                  <Page>
                    <TechnicalPage />
                  </Page>
                }
              />
              <Route
                path="applications"
                element={
                  <Page>
                    <ApplicationsPage />
                  </Page>
                }
              />
              <Route
                path="interviews"
                element={
                  <Page>
                    <InterviewsPage />
                  </Page>
                }
              />
              <Route
                path="mock-interviews"
                element={
                  <Page>
                    <MockInterviewsPage />
                  </Page>
                }
              />
              <Route
                path="tasks"
                element={
                  <Page>
                    <TasksPage />
                  </Page>
                }
              />
              <Route
                path="goals"
                element={
                  <Page>
                    <TasksPage initialTab="goals" />
                  </Page>
                }
              />
              <Route
                path="companies"
                element={
                  <Page>
                    <CompaniesPage />
                  </Page>
                }
              />
              <Route
                path="notes"
                element={
                  <Page>
                    <NotesPage />
                  </Page>
                }
              />
              <Route
                path="settings"
                element={
                  <Page>
                    <SettingsPage />
                  </Page>
                }
              />
              <Route
                path="*"
                element={
                  <Page>
                    <NotFoundPage />
                  </Page>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
