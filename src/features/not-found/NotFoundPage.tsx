import { Compass, Home, Map } from 'lucide-react';
import { LinkButton } from '../../components/common/LinkButton';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xs font-medium uppercase tracking-[0.16em] text-muted-foreground">404 · Off the plan</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        The link may be outdated, or the route was mistyped. Head back to the dashboard or jump straight into your
        roadmap.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <LinkButton to="/">
          <Home className="h-4 w-4" />
          Go to dashboard
        </LinkButton>
        <LinkButton to="/roadmap" variant="outline">
          <Map className="h-4 w-4" />
          Open roadmap
        </LinkButton>
      </div>
    </div>
  );
}
