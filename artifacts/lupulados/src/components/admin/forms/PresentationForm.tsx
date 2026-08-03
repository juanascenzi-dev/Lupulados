import { useState } from "react";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parsePresentationForm,
  parsePresentationUpdateForm,
  type PresentationFormValues,
} from "@/domain/adminFormAdapters";
import type { Product } from "@/domain/commercialTypes";

export function PresentationForm({
  products,
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  products: Product[];
  disabled: boolean;
  initial?: PresentationFormValues;
  onCancel?: () => void;
  onSubmit: (input: Record<string, unknown>, mode: "create" | "edit") => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const mode = initial ? "edit" : "create";
  const editId = initial?.id;
  return (
    <AdminForm
      title={editId ? `Editar presentación ${editId}` : "Crear presentación"}
      error={error}
      disabled={disabled}
      submitLabel={mode === "edit" ? "Guardar cambios" : "Crear presentación"}
      onCancel={onCancel}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = Object.fromEntries(new FormData(form));
        try {
          void (mode === "edit"
            ? parsePresentationUpdateForm(input, products)
            : parsePresentationForm(input, products));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Presentación inválida."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") form.reset();
      }}
    >
      <Field name="id" label="ID" defaultValue={initial?.id} disabled={mode === "edit"} />
      <SelectField
        name="productId"
        label="Producto"
        options={products.map((product) => product.id)}
        defaultValue={initial?.productId}
      />
      <SelectField
        name="presentationType"
        label="Tipo"
        options={["barril20L", "barril30L", "barril50L", "growler1L", "growler2L", "porron500ml"]}
        defaultValue={initial?.presentationType}
      />
      <Field name="label" label="Etiqueta" defaultValue={initial?.label} />
      <Field
        name="volumeLiters"
        label="Volumen L"
        type="number"
        step="0.1"
        defaultValue={initial?.volumeLiters ?? ""}
      />
      <Field name="unitPrice" label="Precio" type="number" defaultValue={initial?.unitPrice ?? 0} />
      <SelectField
        name="category"
        label="Categoría"
        options={["barril", "growler", "porrón", "pack"]}
        defaultValue={initial?.category}
      />
      <Field
        name="description"
        label="Descripción"
        defaultValue={initial?.description ?? ""}
        required={false}
      />
      <Field name="sortOrder" label="Orden" type="number" defaultValue={initial?.sortOrder ?? 0} />
    </AdminForm>
  );
}
