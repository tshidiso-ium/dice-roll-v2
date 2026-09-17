import React from "react";

export default class ErrorBoundary extends React.Component {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error, info) {
    console.error("Application render failed", {
      message: error?.message,
      componentStack: info?.componentStack,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <section role="alert" className="max-w-md rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-center">
          <h1 className="text-xl font-bold text-yellow-300">The game could not be displayed</h1>
          <p className="mt-3 text-sm text-white/80">Reload the page to recover. Your server-side balance and game state are unchanged.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-yellow-400 px-4 py-2 font-bold text-black"
          >
            Reload
          </button>
        </section>
      </main>
    );
  }
}
