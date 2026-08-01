import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parseProductForm,
  parseProductUpdateForm,
  type ProductFormValues,
} from "@/domain/adminFormAdapters";

export function ProductForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial?: ProductFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar producto ${editId}` : "Crear producto"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear producto"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const input = Object.fromEntries(new FormData(event.currentTarget));
        try {
          void (mode === "edit" ? parseProductUpdateForm(input) : parseProductForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Producto inválido."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") event.currentTarget.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <Field name="slug" label="Slug" defaultValue={initial?.slug} />
      <Field name="name" label="Nombre" defaultValue={initial?.name} />
      <Field name="style" label="Estilo" defaultValue={initial?.style} />
      <Field
        name="description"
        label="Descripción"
        defaultValue={initial?.description}
        className="md:col-span-2"
      />
      <Field
        name="image"
        label="URL imagen"
        defaultValue={initial?.image}
        className="md:col-span-2"
      />
      <SelectField
        name="category"
        label="Categoría"
        options={["beer", "pack"]}
        defaultValue={initial?.category ?? "beer"}
      />
      <Field name="sortOrder" label="Orden" type="number" defaultValue={initial?.sortOrder ?? 0} />
      <Field
        name="abv"
        label="ABV"
        type="number"
        step="0.1"
        defaultValue={initial?.abv ?? ""}
        required={false}
      />
      <Field
        name="ibu"
        label="IBU"
        type="number"
        step="1"
        defaultValue={initial?.ibu ?? ""}
        required={false}
      />
      <Field name="badge" label="Badge" defaultValue={initial?.badge ?? ""} required={false} />
    </AdminForm>
  );
}
