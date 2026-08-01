import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import {
  getFirstZodError,
  parseExtraForm,
  parseExtraUpdateForm,
  type ExtraFormValues,
} from "@/domain/adminFormAdapters";

export function ExtraForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial?: ExtraFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar extra ${editId}` : "Crear extra"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear extra"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const input = Object.fromEntries(new FormData(event.currentTarget));
        try {
          void (mode === "edit" ? parseExtraUpdateForm(input) : parseExtraForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Extra inválido."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") event.currentTarget.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <Field name="label" label="Etiqueta" defaultValue={initial?.label} />
      <Field name="price" label="Precio" type="number" defaultValue={initial?.price ?? 0} />
      <Field name="unit" label="Unidad" defaultValue={initial?.unit ?? "unidad"} />
      <Field name="sortOrder" label="Orden" type="number" defaultValue={initial?.sortOrder ?? 0} />
    </AdminForm>
  );
}
