import type { RefObject } from "react";

interface RouteFallbackProps {
  label?: string;
  id?: string;
  minHeightClassName?: string;
  sectionRef?: RefObject<HTMLElement | null>;
}

export function RouteFallback({
  label = "Cargando contenido...",
  id,
  minHeightClassName = "min-h-[55vh]",
  sectionRef,
}: RouteFallbackProps) {
  return (
    <section
      id={id}
      ref={sectionRef}
      className={`${minHeightClassName} bg-background border-y border-white/5 px-4 py-16 flex items-center justify-center`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-3xl rounded-lg border border-white/10 bg-card/70 p-6">
        <div className="h-4 w-40 rounded bg-primary/30 mb-4" />
        <div className="h-8 w-3/4 rounded bg-white/10 mb-3" />
        <div className="h-4 w-full rounded bg-white/10 mb-2" />
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <span className="sr-only">{label}</span>
      </div>
    </section>
  );
}
