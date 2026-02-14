import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled render error", error, info);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: "" });
    window.location.assign("/");
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something broke in the interface.</h1>
          <p>{this.state.message || "Unexpected runtime error."}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReset}>
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
