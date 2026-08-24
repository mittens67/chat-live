import { Component } from "react";
import Button from "react-bootstrap/Button";

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
      <div className="error-boundary">
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error.</p>
        <Button onClick={() => window.location.assign("/")}>
          Back to safety
        </Button>
      </div>
    );
  }
}

export default ErrorBoundary;
