import React from "react";

// Catches render/runtime errors anywhere below it so a single thrown error
// shows a friendly fallback instead of a blank white screen in production.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface the error in the console for debugging; no external reporting.
    console.error("Unexpected UI error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="mobile-page grid place-items-center bg-orange-50">
          <section className="surface p-6 text-center">
            <h1 className="text-3xl font-black leading-none tracking-normal text-slate-950">
              Something went sideways.
            </h1>
            <p className="mt-3 text-slate-600">
              This Plot Twist hit an unexpected error. Try reloading the page.
            </p>
            <button className="button-primary mt-6" type="button" onClick={this.handleReload}>
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
