import type { ReactNode } from "react";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <section className="max-w-lg bg-card border border-white/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <div className="text-muted-foreground">{children}</div>
      </section>
    </main>
  );
}
