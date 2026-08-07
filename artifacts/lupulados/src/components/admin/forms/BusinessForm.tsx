import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminForm } from "@/components/admin/forms/AdminForm";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import {
  getFirstZodError,
  parseBusinessProfileForm,
  type BusinessProfileFormValues,
} from "@/domain/adminFormAdapters";

export function BusinessForm({
  profile,
  disabled,
  onSubmit,
}: {
  profile: BusinessProfileFormValues;
  disabled: boolean;
  onSubmit: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  return (
    <AdminForm
      title="Información comercial"
      error={error}
      disabled={disabled}
      submitLabel="Guardar cambios"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const input = Object.fromEntries(new FormData(form));
        try {
          void parseBusinessProfileForm(input);
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Información comercial inválida."));
          return;
        }
        await onSubmit(input);
      }}
    >
      <Field name="businessName" label="Nombre" defaultValue={profile.businessName} />
      <Field name="address" label="Dirección" defaultValue={profile.address} />
      <Field name="openingHours" label="Horario" defaultValue={profile.openingHours} />
      <Field
        name="email"
        label="Email"
        type="email"
        defaultValue={profile.email ?? ""}
        required={false}
      />
      <SelectField
        name="pricingStatus"
        label="Estado precios"
        options={["estimated", "confirmed"]}
        defaultValue={profile.pricingStatus}
      />
      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="priceDisclaimer">Disclaimer</Label>
        <Textarea
          id="priceDisclaimer"
          name="priceDisclaimer"
          required
          defaultValue={profile.priceDisclaimer}
          className="bg-black/40 border-white/10 text-white"
        />
      </div>
    </AdminForm>
  );
}
