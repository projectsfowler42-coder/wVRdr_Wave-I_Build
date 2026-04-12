import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error) {
    console.error("Wave-I shell boundary trapped a render failure", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-xl rounded-xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Wave-I Ghost Chassis
            </div>
            <h1 className="mt-2 text-xl font-semibold">Shell boundary degraded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A module failed inside the mounted surface. The shell stayed mounted and the
              failure was contained by the runtime boundary.
            </p>
            {this.state.message ? (
              <p className="mt-3 text-xs text-muted-foreground">{this.state.message}</p>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
