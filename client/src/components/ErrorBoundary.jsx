import { Component } from "react";

/**
 * Catches render-time errors so one bad value can't white-screen the app.
 * Must be a class - React has no hook equivalent for componentDidCatch.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center text-text">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-subtle">The page hit an unexpected error.</p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
        >
          Back to safety
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
