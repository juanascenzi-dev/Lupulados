import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Field } from "@/components/admin/Field";
import { SelectField } from "@/components/admin/SelectField";
import type { BusinessProfile } from "@/domain/commercialTypes";

export function BusinessForm({
  profile,
  disabled,
  onSubmit,
}: {
  profile: BusinessProfile;
  disabled: boolean;
  onSubmit: (input: {
    businessName: string;
    address: string;
    openingHours: string;
    email: string | null;
    pricingStatus: "estimated" | "confirmed";
    priceDisclaimer: string;
  }) => void;
}) {
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-white/10 rounded-lg p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          businessName: String(form.get("businessName") ?? ""),
          address: String(form.get("address") ?? ""),
          openingHours: String(form.get("openingHours") ?? ""),
          email: String(form.get("email") ?? "").trim() || null,
          pricingStatus: String(form.get("pricingStatus") ?? "estimated") as
            | "estimated"
            | "confirmed",
          priceDisclaimer: String(form.get("priceDisclaimer") ?? ""),
        });
      }}
    >
      <Field name="businessName" label="Nombre" defaultValue={profile.businessName} />
      <Field name="address" label="Dirección" defaultValue={profile.address} />
      <Field name="openingHours" label="Horario" defaultValue={profile.openingHours} />
      <Field name="email" label="Email" defaultValue={profile.email ?? ""} />
      <SelectField
        name="pricingStatus"
        label="Estado precios"
        options={["estimated", "confirmed"]}
        defaultValue={profile.pricingStatus}
      />
      <div className="md:col-span-2 space-y-1">
        <Label htmlFor="priceDisclaimer">Disclaimer</Label>
        <Textarea
          id="priceDisclaimer"
          name="priceDisclaimer"
          required
          defaultValue={profile.priceDisclaimer}
          className="bg-black/40 border-white/10 text-white"
        />
      </div>
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500">
        <Save className="w-4 h-4 mr-2" /> Guardar
      </Button>
    </form>
  );
}
