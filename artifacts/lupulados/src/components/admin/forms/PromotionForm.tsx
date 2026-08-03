import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parsePromotionForm,
  parsePromotionUpdateForm,
  type PromotionFormValues,
} from "@/domain/adminFormAdapters";

export function PromotionForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial?: PromotionFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar promoción ${editId}` : "Crear promoción"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear promoción"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = Object.fromEntries(new FormData(form));
        try {
          void (mode === "edit" ? parsePromotionUpdateForm(input) : parsePromotionForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Promoción inválida."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") form.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <Field name="code" label="Código" defaultValue={initial?.code} />
      <SelectField
        name="type"
        label="Tipo"
        options={["percentage", "fixed"]}
        defaultValue={initial?.type}
      />
      <Field
        name="value"
        label="Valor"
        type="number"
        step="0.01"
        defaultValue={initial?.value ?? 0}
      />
      <Field
        name="startDate"
        label="Desde"
        type="date"
        defaultValue={initial?.startDate ?? ""}
        required={false}
      />
      <Field
        name="endDate"
        label="Hasta"
        type="date"
        defaultValue={initial?.endDate ?? ""}
        required={false}
      />
    </AdminForm>
  );
}
