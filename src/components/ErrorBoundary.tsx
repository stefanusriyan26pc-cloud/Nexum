import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to error monitoring service (e.g. Sentry)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg-primary)] px-6 text-center"
          role="alert"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-status-danger-bg)]">
            <svg
              className="h-8 w-8 text-[var(--color-status-danger)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-high)]">
              Something went wrong
            </h1>
            <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 max-w-md overflow-auto rounded-lg bg-[var(--color-bg-elevated)] p-3 text-left text-xs text-[var(--color-status-danger)]">
                {this.state.error.message}
              </pre>
            )}
          </div>

          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)]"
          >
            Back to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
