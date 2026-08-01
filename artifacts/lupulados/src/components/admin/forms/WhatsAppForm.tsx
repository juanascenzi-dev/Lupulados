import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parseWhatsAppForm,
  parseWhatsAppUpdateForm,
  type WhatsAppFormValues,
} from "@/domain/adminFormAdapters";

export function WhatsAppForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial?: WhatsAppFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar WhatsApp ${editId}` : "Crear WhatsApp"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear canal"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const input = Object.fromEntries(new FormData(event.currentTarget));
        try {
          void (mode === "edit" ? parseWhatsAppUpdateForm(input) : parseWhatsAppForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "WhatsApp inválido."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") event.currentTarget.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <Field name="label" label="Etiqueta" defaultValue={initial?.label} />
      <Field name="phoneDisplay" label="Visible" defaultValue={initial?.phoneDisplay} />
      <Field name="phoneE164" label="E.164" defaultValue={initial?.phoneE164} />
      <SelectField
        name="purpose"
        label="Uso"
        options={["orders", "contact", "orders_and_contact"]}
        defaultValue={initial?.purpose}
      />
      <Field name="sortOrder" label="Orden" type="number" defaultValue={initial?.sortOrder ?? 0} />
    </AdminForm>
  );
}
