import { Archive, CheckCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({
  archived,
  disabled,
  onEdit,
  onArchive,
  onRestore,
}: {
  archived: boolean;
  disabled: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={disabled} onClick={onEdit}>
        <Edit className="w-4 h-4 mr-1" /> Editar
      </Button>
      {archived ? (
        <Button size="sm" variant="outline" disabled={disabled} onClick={onRestore}>
          <CheckCircle className="w-4 h-4 mr-1" /> Restaurar
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={disabled} onClick={onArchive}>
          <Archive className="w-4 h-4 mr-1" /> Archivar
        </Button>
      )}
    </div>
  );
}
