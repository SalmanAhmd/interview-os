import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-popover">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              The page could not be rendered. Your locally saved data has not been changed.
            </p>
            {this.state.error ? (
              <pre className="mt-4 max-h-32 overflow-auto rounded-md border bg-muted/50 p-3 font-mono text-2xs leading-5 text-muted-foreground">
                {this.state.error.message}
              </pre>
            ) : null}
            <div className="mt-5 flex items-center gap-2">
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="h-4 w-4" />
                Reload app
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.hash = '#/';
                  window.location.reload();
                }}
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
