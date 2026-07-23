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
        <main className="mobile-page grid place-items-center bg-app text-white">
          <section className="surface p-6 text-center">
            <h1 className="font-display text-3xl font-bold leading-[1.06] tracking-tight text-white">
              Something went sideways.
            </h1>
            <p className="mt-3 text-white/65">
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
