import { useMemo, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useLocation } from "wouter";
import { Archive, CheckCircle, LogOut, Plus, RefreshCw, Save } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import { SupabaseCommercialRepository, type AdminAuditLogEntry } from "@/domain/commercialRepository";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { DeliveryOption, ExtraOption, Product, ProductPresentation, Promotion, WhatsAppChannel } from "@/domain/commercialTypes";

type AdminTab = "summary" | "products" | "presentations" | "business" | "whatsapp" | "delivery" | "extras" | "promotions" | "activity";

const tabs: { id: AdminTab; label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "products", label: "Productos" },
  { id: "presentations", label: "Presentaciones" },
  { id: "business", label: "Info comercial" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "delivery", label: "Entrega" },
  { id: "extras", label: "Extras" },
  { id: "promotions", label: "Promociones" },
  { id: "activity", label: "Actividad" },
];

const productSchema = z.object({
  id: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  style: z.string().trim().min(1),
  category: z.enum(["beer", "pack"]),
  image: z.string().url(),
  sortOrder: z.coerce.number().int().nonnegative(),
});

const presentationSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  presentationType: z.enum(["barril20L", "barril30L", "barril50L", "growler1L", "growler2L", "porron500ml"]),
  label: z.string().trim().min(1),
  volumeLiters: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  category: z.enum(["barril", "growler", "porrón", "pack"]),
  sortOrder: z.coerce.number().int().nonnegative(),
});

const phoneSchema = z.string().regex(/^54911\d{8}$/, "Usá formato E.164: 54911XXXXXXXX.");
const promotionSchema = z.object({
  id: z.string().trim().min(1),
  code: z.string().trim().min(1).transform((value) => value.toUpperCase()),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().nonnegative(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.type === "percentage" && value.value > 1) {
    ctx.addIssue({ code: "custom", path: ["value"], message: "El porcentaje debe expresarse entre 0 y 1." });
  }
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    ctx.addIssue({ code: "custom", path: ["startDate"], message: "La fecha inicial debe ser anterior a la final." });
  }
});

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const auth = useAdminAuth();
  const commercial = useCommercialData();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [audit, setAudit] = useState<AdminAuditLogEntry[]>([]);
  const repository = useMemo(() => {
    const client = getSupabaseClient();
    return client ? new SupabaseCommercialRepository(client) : null;
  }, []);

  if (auth.access === "loading") return <AdminShell title="Cargando sesión">Verificando acceso administrativo...</AdminShell>;
  if (auth.access === "unconfigured") {
    return <AdminShell title="Configuración pendiente">Supabase no está configurado. Definí `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.</AdminShell>;
  }
  if (auth.access === "anonymous") {
    navigate("/admin/login", { replace: true });
    return null;
  }
  if (auth.access === "unauthorized") {
    return <AdminShell title="Acceso no autorizado">Tu sesión no tiene un rol ADMIN activo en `public.admin_users`.</AdminShell>;
  }

  const run = async (action: () => Promise<unknown>, success: string) => {
    if (!repository) return;
    setBusy(true);
    try {
      await action();
      await commercial.refresh();
      toast({ title: success });
    } catch (error) {
      toast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Error inesperado." });
    } finally {
      setBusy(false);
    }
  };

  const products = commercial.snapshot.products.filter((product) => {
    const term = search.trim().toLowerCase();
    return !term || product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term);
  });

  return (
    <main className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lupulados ADMIN</h1>
            <p className="text-sm text-muted-foreground">{auth.user?.email} · fuente pública: {commercial.source}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void commercial.refresh()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refrescar
            </Button>
            <Button variant="outline" onClick={() => void auth.signOut().then(() => navigate("/admin/login", { replace: true }))}>
              <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="summary">
          <TabsList className="h-auto flex flex-wrap justify-start bg-card border border-white/10">
            {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="summary">
            <MetricGrid
              metrics={[
                ["Productos activos", commercial.snapshot.products.filter((product) => product.status === "active").length],
                ["Productos archivados", commercial.snapshot.products.filter((product) => product.status === "archived").length],
                ["Presentaciones activas", commercial.snapshot.productPresentations.filter((item) => item.active).length],
                ["WhatsApp activos", commercial.snapshot.whatsappChannels.filter((item) => item.active).length],
                ["Promociones activas", commercial.snapshot.promotions.filter((item) => item.active).length],
              ]}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto" className="max-w-sm bg-card border-white/10" />
            <ProductForm disabled={busy} onSubmit={(product) => run(() => repository!.createProduct(product), "Producto creado")} />
            <AdminTable
              rows={products}
              columns={["ID", "Nombre", "Estado", "Orden", "Acciones"]}
              render={(product) => [
                product.id,
                product.name,
                product.status,
                product.sortOrder,
                <RowActions
                  key="actions"
                  archived={product.status === "archived"}
                  disabled={busy}
                  onArchive={() => confirmArchive(product.name) && void run(() => repository!.archiveProduct(product.id), "Producto archivado")}
                  onRestore={() => run(() => repository!.restoreProduct(product.id), "Producto restaurado")}
                />,
              ]}
            />
          </TabsContent>

          <TabsContent value="presentations" className="space-y-4">
            <PresentationForm products={commercial.snapshot.products} disabled={busy} onSubmit={(input) => run(() => repository!.createPresentation(input), "Presentación creada")} />
            <AdminTable
              rows={commercial.snapshot.productPresentations}
              columns={["ID", "Producto", "Etiqueta", "Precio", "Estado", "Acciones"]}
              render={(item) => [
                item.id,
                item.productId,
                item.label,
                `$${item.unitPrice}`,
                item.active ? "active" : "archived",
                <RowActions
                  key="actions"
                  archived={!item.active}
                  disabled={busy}
                  onArchive={() => confirmArchive(item.label) && void run(() => repository!.archivePresentation(item.id), "Presentación archivada")}
                  onRestore={() => run(() => repository!.restorePresentation(item.id), "Presentación restaurada")}
                />,
              ]}
            />
          </TabsContent>

          <TabsContent value="business">
            <BusinessForm
              profile={commercial.snapshot.businessProfile}
              disabled={busy}
              onSubmit={(input) => run(() => repository!.updateBusinessProfile(input), "Información comercial actualizada")}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppForm disabled={busy} onSubmit={(input) => run(() => repository!.createWhatsAppChannel(input), "WhatsApp creado")} />
            <AdminTable
              rows={commercial.snapshot.whatsappChannels}
              columns={["ID", "Teléfono", "Principal", "Activo", "Acciones"]}
              render={(channel) => [
                channel.id,
                `${channel.label}: ${channel.phoneDisplay}`,
                channel.isPrimary ? "sí" : "no",
                channel.active ? "sí" : "no",
                <div key="actions" className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => repository!.setPrimaryWhatsAppChannel(channel.id), "WhatsApp principal actualizado")}>Principal</Button>
                  <RowActions archived={!channel.active} disabled={busy} onArchive={() => confirmArchive(channel.label) && void run(() => repository!.archiveWhatsAppChannel(channel.id), "WhatsApp desactivado")} onRestore={() => run(() => repository!.updateWhatsAppChannel(channel.id, { active: true }), "WhatsApp restaurado")} />
                </div>,
              ]}
            />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <DeliveryForm disabled={busy} onSubmit={(input) => run(() => repository!.createDeliveryOption(input), "Opción de entrega creada")} />
            <ToggleTable rows={commercial.snapshot.deliveryOptions} disabled={busy} onArchive={(id) => repository!.archiveDeliveryOption(id)} onRestore={(id) => repository!.restoreDeliveryOption(id)} />
          </TabsContent>

          <TabsContent value="extras" className="space-y-4">
            <ExtraForm disabled={busy} onSubmit={(input) => run(() => repository!.createExtraOption(input), "Extra creado")} />
            <ToggleTable rows={commercial.snapshot.extraOptions} disabled={busy} onArchive={(id) => repository!.archiveExtraOption(id)} onRestore={(id) => repository!.restoreExtraOption(id)} />
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            <PromotionForm disabled={busy} onSubmit={(input) => run(() => repository!.createPromotion(input), "Promoción creada")} />
            <AdminTable
              rows={commercial.snapshot.promotions}
              columns={["Código", "Tipo", "Valor", "Activo", "Acciones"]}
              render={(promotion) => [
                promotion.code,
                promotion.type,
                promotion.value,
                promotion.active ? "sí" : "no",
                <RowActions key="actions" archived={!promotion.active} disabled={busy} onArchive={() => confirmArchive(promotion.code) && void run(() => repository!.archivePromotion(promotion.id), "Promoción desactivada")} onRestore={() => run(() => repository!.restorePromotion(promotion.id), "Promoción restaurada")} />,
              ]}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Button variant="outline" onClick={() => repository?.listAuditLog().then(setAudit)}>
              <RefreshCw className="w-4 h-4 mr-2" /> Cargar actividad reciente
            </Button>
            <AdminTable
              rows={audit}
              columns={["Fecha", "Tabla", "Operación", "Registro"]}
              render={(entry) => [entry.createdAt, entry.tableName, entry.operation, entry.recordId ?? "-"]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <section className="max-w-lg bg-card border border-white/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <div className="text-muted-foreground">{children}</div>
      </section>
    </main>
  );
}

function MetricGrid({ metrics }: { metrics: [string, number][] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="bg-card border border-white/10 rounded-lg p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-primary">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminTable<T>({ rows, columns, render }: { rows: T[]; columns: string[]; render: (row: T) => ReactNode[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>{columns.map((column) => <th key={column} className="p-3 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/10">
              {render(row).map((cell, cellIndex) => <td key={cellIndex} className="p-3 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ archived, disabled, onArchive, onRestore }: { archived: boolean; disabled: boolean; onArchive: () => void; onRestore: () => void }) {
  return archived ? (
    <Button size="sm" variant="outline" disabled={disabled} onClick={onRestore}><CheckCircle className="w-4 h-4 mr-1" /> Restaurar</Button>
  ) : (
    <Button size="sm" variant="outline" disabled={disabled} onClick={onArchive}><Archive className="w-4 h-4 mr-1" /> Archivar</Button>
  );
}

function ProductForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (product: z.infer<typeof productSchema>) => void }) {
  const [error, setError] = useState("");
  return (
    <form className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const parsed = productSchema.safeParse(Object.fromEntries(form));
      if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Producto inválido.");
      setError("");
      onSubmit(parsed.data);
      event.currentTarget.reset();
    }}>
      <Field name="id" label="ID" />
      <Field name="slug" label="Slug" />
      <Field name="name" label="Nombre" />
      <Field name="style" label="Estilo" />
      <Field name="description" label="Descripción" className="md:col-span-2" />
      <Field name="image" label="URL imagen" className="md:col-span-2" />
      <input type="hidden" name="category" value="beer" />
      <Field name="sortOrder" label="Orden" type="number" />
      {error && <p className="md:col-span-4 text-sm text-red-300">{error}</p>}
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Plus className="w-4 h-4 mr-2" /> Crear producto</Button>
    </form>
  );
}

function PresentationForm({ products, disabled, onSubmit }: { products: Product[]; disabled: boolean; onSubmit: (input: z.infer<typeof presentationSchema>) => void }) {
  const [error, setError] = useState("");
  return (
    <form className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const parsed = presentationSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
      if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Presentación inválida.");
      if (!products.some((product) => product.id === parsed.data.productId)) return setError("El producto no existe.");
      setError("");
      onSubmit(parsed.data);
      event.currentTarget.reset();
    }}>
      <Field name="id" label="ID" />
      <SelectField name="productId" label="Producto" options={products.map((product) => product.id)} />
      <SelectField name="presentationType" label="Tipo" options={["barril20L", "barril30L", "barril50L", "growler1L", "growler2L", "porron500ml"]} />
      <Field name="label" label="Etiqueta" />
      <Field name="volumeLiters" label="Volumen L" type="number" step="0.1" />
      <Field name="unitPrice" label="Precio" type="number" />
      <SelectField name="category" label="Categoría" options={["barril", "growler", "porrón", "pack"]} />
      <Field name="sortOrder" label="Orden" type="number" />
      {error && <p className="md:col-span-4 text-sm text-red-300">{error}</p>}
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Plus className="w-4 h-4 mr-2" /> Crear presentación</Button>
    </form>
  );
}

function BusinessForm({ profile, disabled, onSubmit }: { profile: ReturnType<typeof useCommercialData>["snapshot"]["businessProfile"]; disabled: boolean; onSubmit: (input: { businessName: string; address: string; openingHours: string; email: string | null; pricingStatus: "estimated" | "confirmed"; priceDisclaimer: string }) => void }) {
  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        businessName: String(form.get("businessName") ?? ""),
        address: String(form.get("address") ?? ""),
        openingHours: String(form.get("openingHours") ?? ""),
        email: String(form.get("email") ?? "").trim() || null,
        pricingStatus: String(form.get("pricingStatus") ?? "estimated") as "estimated" | "confirmed",
        priceDisclaimer: String(form.get("priceDisclaimer") ?? ""),
      });
    }}>
      <Field name="businessName" label="Nombre" defaultValue={profile.businessName} />
      <Field name="address" label="Dirección" defaultValue={profile.address} />
      <Field name="openingHours" label="Horario" defaultValue={profile.openingHours} />
      <Field name="email" label="Email" defaultValue={profile.email ?? ""} />
      <SelectField name="pricingStatus" label="Estado precios" options={["estimated", "confirmed"]} defaultValue={profile.pricingStatus} />
      <div className="md:col-span-2 space-y-1">
        <Label htmlFor="priceDisclaimer">Disclaimer</Label>
        <Textarea id="priceDisclaimer" name="priceDisclaimer" required defaultValue={profile.priceDisclaimer} className="bg-black/40 border-white/10 text-white" />
      </div>
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Save className="w-4 h-4 mr-2" /> Guardar</Button>
    </form>
  );
}

function WhatsAppForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (input: WhatsAppChannel) => void }) {
  const [error, setError] = useState("");
  return (
    <form className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const phone = String(form.get("phoneE164") ?? "");
      const parsedPhone = phoneSchema.safeParse(phone);
      if (!parsedPhone.success) return setError(parsedPhone.error.issues[0]?.message ?? "Teléfono inválido.");
      setError("");
      onSubmit({
        id: String(form.get("id")),
        label: String(form.get("label")),
        phoneDisplay: String(form.get("phoneDisplay")),
        phoneE164: parsedPhone.data,
        purpose: String(form.get("purpose")) as WhatsAppChannel["purpose"],
        isPrimary: false,
        active: true,
        sortOrder: Number(form.get("sortOrder")),
      });
      event.currentTarget.reset();
    }}>
      <Field name="id" label="ID" />
      <Field name="label" label="Etiqueta" />
      <Field name="phoneDisplay" label="Visible" />
      <Field name="phoneE164" label="E.164" />
      <SelectField name="purpose" label="Uso" options={["orders", "contact", "orders_and_contact"]} />
      <Field name="sortOrder" label="Orden" type="number" />
      {error && <p className="md:col-span-4 text-sm text-red-300">{error}</p>}
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Plus className="w-4 h-4 mr-2" /> Crear canal</Button>
    </form>
  );
}

function DeliveryForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (input: DeliveryOption) => void }) {
  return <ToggleForm disabled={disabled} submitLabel="Crear entrega" onSubmit={(input) => onSubmit({ ...input, requiresAddress: true, description: input.label })} />;
}

function ExtraForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (input: ExtraOption) => void }) {
  return <ToggleForm disabled={disabled} submitLabel="Crear extra" unit onSubmit={(input) => onSubmit({ ...input, unit: input.unit ?? "unidad" })} />;
}

function PromotionForm({ disabled, onSubmit }: { disabled: boolean; onSubmit: (input: Promotion) => void }) {
  const [error, setError] = useState("");
  return (
    <form className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const parsed = promotionSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
      if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Promoción inválida.");
      setError("");
      onSubmit({ ...parsed.data, active: true });
      event.currentTarget.reset();
    }}>
      <Field name="id" label="ID" />
      <Field name="code" label="Código" />
      <SelectField name="type" label="Tipo" options={["percentage", "fixed"]} />
      <Field name="value" label="Valor" type="number" step="0.01" />
      <Field name="startDate" label="Desde" type="date" />
      <Field name="endDate" label="Hasta" type="date" />
      {error && <p className="md:col-span-4 text-sm text-red-300">{error}</p>}
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Plus className="w-4 h-4 mr-2" /> Crear promoción</Button>
    </form>
  );
}

function ToggleForm({ disabled, submitLabel, unit, onSubmit }: { disabled: boolean; submitLabel: string; unit?: boolean; onSubmit: (input: { id: string; label: string; price: number; active: true; sortOrder: number; unit?: string }) => void }) {
  return (
    <form className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      onSubmit({
        id: String(form.get("id")),
        label: String(form.get("label")),
        price: Number(form.get("price")),
        active: true,
        sortOrder: Number(form.get("sortOrder")),
        unit: unit ? String(form.get("unit") || "unidad") : undefined,
      });
      event.currentTarget.reset();
    }}>
      <Field name="id" label="ID" />
      <Field name="label" label="Etiqueta" />
      <Field name="price" label="Precio" type="number" />
      {unit && <Field name="unit" label="Unidad" />}
      <Field name="sortOrder" label="Orden" type="number" />
      <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500"><Plus className="w-4 h-4 mr-2" /> {submitLabel}</Button>
    </form>
  );
}

function ToggleTable<T extends { id: string; label: string; price: number; active: boolean }>({ rows, disabled, onArchive, onRestore }: { rows: T[]; disabled: boolean; onArchive: (id: string) => Promise<unknown>; onRestore: (id: string) => Promise<unknown> }) {
  const commercial = useCommercialData();
  const { toast } = useToast();
  const runToggle = async (action: Promise<unknown>, message: string) => {
    await action;
    await commercial.refresh();
    toast({ title: message });
  };
  return (
    <AdminTable
      rows={rows}
      columns={["ID", "Etiqueta", "Precio", "Activo", "Acciones"]}
      render={(row) => [
        row.id,
        row.label,
        `$${row.price}`,
        row.active ? "sí" : "no",
        <RowActions key="actions" archived={!row.active} disabled={disabled} onArchive={() => confirmArchive(row.label) && void runToggle(onArchive(row.id), "Archivado")} onRestore={() => void runToggle(onRestore(row.id), "Restaurado")} />,
      ]}
    />
  );
}

function Field({ name, label, className, ...props }: { name: string; label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required className="bg-black/40 border-white/10 text-white" {...props} />
    </div>
  );
}

function SelectField({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className="h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function confirmArchive(label: string) {
  return window.confirm(`Archivar ${label}?`);
}
