import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { error: Error | null };

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <p className="font-semibold text-button-danger">Something went wrong.</p>
          <pre className="mt-2 whitespace-pre-wrap rounded border border-border bg-bg-accent p-3 text-xs font-mono">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="mt-3 text-sm text-link hover:text-link-active"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
