import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[render-error]", error, info.componentStack);
    }
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-background text-white flex items-center justify-center px-4">
        <section className="max-w-md w-full rounded-lg border border-white/10 bg-card p-6 text-center">
          <h1 className="text-2xl font-display font-bold mb-3">No pudimos mostrar esta seccion</h1>
          <p className="text-muted-foreground mb-6">
            Hubo un problema inesperado al cargar el contenido. Podes reintentar o volver al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.retry}
              className="px-5 py-3 rounded-md bg-primary text-black font-bold hover:bg-amber-400 transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="px-5 py-3 rounded-md border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </section>
      </main>
    );
  }
}
