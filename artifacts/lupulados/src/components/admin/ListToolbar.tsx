import { StatusFilterControl } from "@/components/admin/StatusFilterControl";
import type { StatusFilter } from "@/domain/adminDashboardHelpers";

export function ListToolbar({
  status,
  onStatusChange,
}: {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex justify-end">
      <StatusFilterControl value={status} onChange={onStatusChange} />
    </div>
  );
}
