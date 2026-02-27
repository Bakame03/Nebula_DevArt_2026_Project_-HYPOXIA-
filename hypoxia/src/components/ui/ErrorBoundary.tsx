"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[HYPOXIA] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 bg-[#020617] p-8 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-red-500/60">
            Erreur système
          </span>
          <h1 className="text-4xl font-black tracking-[0.2em] text-white">
            HYPOXIA
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/40">
            Le moteur 3D a rencontré une erreur critique. Votre navigateur
            supporte-t-il WebGL 2 ?
          </p>
          {this.state.message && (
            <code className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono text-white/30">
              {this.state.message}
            </code>
          )}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-white/20 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/70 transition-all hover:border-white/50 hover:text-white"
        >
          Redémarrer
        </button>
      </div>
    );
  }
}
