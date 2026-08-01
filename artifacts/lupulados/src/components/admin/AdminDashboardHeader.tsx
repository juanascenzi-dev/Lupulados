import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboardHeader({
  email,
  source,
  busy,
  adminLoading,
  onRefresh,
  onSignOut,
}: {
  email: string | null | undefined;
  source: string;
  busy: boolean;
  adminLoading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="border-b border-white/10 bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lupulados ADMIN</h1>
          <p className="text-sm text-muted-foreground">
            {email} · fuente pública: {source}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || adminLoading} onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refrescar
          </Button>
          <Button variant="outline" disabled={busy} onClick={onSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
