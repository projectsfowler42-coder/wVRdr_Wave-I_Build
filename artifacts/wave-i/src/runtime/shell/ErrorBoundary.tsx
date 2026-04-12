import React from "react";
import { latestRuntimeError, recordRuntimeError } from "@/runtime/governance/ErrorCatalog";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
  errorId: string | null;
}

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: null,
    errorId: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const record = recordRuntimeError({
      kind: "render",
      message: error.message,
      detail: info.componentStack?.trim() || null,
      source: "runtime/shell/ErrorBoundary",
      stack: error.stack ?? null,
    });
    this.setState({ errorId: record.id });
    console.error("Wave-I shell boundary trapped a render failure", error, info);
  }

  render() {
    if (this.state.hasError) {
      const latest = latestRuntimeError();
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-xl rounded-xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Wave-I Ghost Chassis
            </div>
            <h1 className="mt-2 text-xl font-semibold">Shell boundary degraded</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A mounted module failed. The shell stayed mounted and the failure is now cataloged locally instead of disappearing into a blank surface.
            </p>
            {this.state.message ? (
              <p className="mt-3 text-xs text-muted-foreground">message: {this.state.message}</p>
            ) : null}
            {this.state.errorId ? (
              <p className="mt-1 text-xs text-muted-foreground">error id: {this.state.errorId}</p>
            ) : null}
            {latest?.explanation ? (
              <p className="mt-3 text-xs text-muted-foreground">{latest.explanation}</p>
            ) : null}
            {latest?.detail ? (
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-md border border-border/70 bg-background/60 p-3 text-[10px] text-muted-foreground">
                {latest.detail}
              </pre>
            ) : null}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
