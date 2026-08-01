import { AdminTable } from "@/components/admin/AdminTable";
import { RowActions } from "@/components/admin/RowActions";

export function ToggleTable<
  T extends { id: string; label: string; price: number; active: boolean },
>({
  rows,
  disabled,
  onEdit,
  onArchive,
  onRestore,
}: {
  rows: T[];
  disabled: boolean;
  onEdit: (row: T) => void;
  onArchive: (row: T) => void;
  onRestore: (row: T) => void;
}) {
  return (
    <AdminTable
      rows={rows}
      columns={["ID", "Etiqueta", "Precio", "Activo", "Acciones"]}
      render={(row) => [
        row.id,
        row.label,
        `$${row.price}`,
        row.active ? "sí" : "no",
        <RowActions
          key="actions"
          archived={!row.active}
          disabled={disabled}
          onEdit={() => onEdit(row)}
          onArchive={() => onArchive(row)}
          onRestore={() => onRestore(row)}
        />,
      ]}
    />
  );
}
