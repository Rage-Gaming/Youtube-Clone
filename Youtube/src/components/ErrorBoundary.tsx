import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You can also log the error to an error reporting service here
    toast.error("An unexpected error occurred", {
      description: error.message || "Please refresh the page and try again.",
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Oops, something went wrong!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            We apologize for the inconvenience. An unexpected error has occurred in the application.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
            >
              Go to Home
            </button>
          </div>
          
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <div className="mt-8 p-4 bg-muted rounded-md text-left w-full max-w-2xl overflow-auto text-sm text-muted-foreground">
              <p className="font-mono font-semibold text-foreground mb-2">{this.state.error.toString()}</p>
              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
