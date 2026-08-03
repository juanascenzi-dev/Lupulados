import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parseDeliveryForm,
  parseDeliveryUpdateForm,
  type DeliveryFormValues,
} from "@/domain/adminFormAdapters";

export function DeliveryForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial?: DeliveryFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar entrega ${editId}` : "Crear entrega"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear entrega"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = Object.fromEntries(new FormData(form));
        try {
          void (mode === "edit" ? parseDeliveryUpdateForm(input) : parseDeliveryForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Entrega inválida."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") form.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <Field name="label" label="Etiqueta" defaultValue={initial?.label} />
      <Field
        name="description"
        label="Descripción"
        defaultValue={initial?.description}
        className="md:col-span-2"
      />
      <Field name="price" label="Precio" type="number" defaultValue={initial?.price ?? 0} />
      <SelectField
        name="requiresAddress"
        label="Requiere dirección"
        options={["true", "false"]}
        defaultValue={String(initial?.requiresAddress ?? true)}
      />
      <Field name="sortOrder" label="Orden" type="number" defaultValue={initial?.sortOrder ?? 0} />
    </AdminForm>
  );
}
