import { Button } from "@/components/ui/button";
import type { StatusFilter } from "@/domain/adminDashboardHelpers";

export function StatusFilterControl({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["all", "active", "archived"] as const).map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={value === status ? "default" : "outline"}
          onClick={() => onChange(status)}
        >
          {status === "all" ? "Todos" : status === "active" ? "Activos" : "Archivados"}
        </Button>
      ))}
    </div>
  );
}
