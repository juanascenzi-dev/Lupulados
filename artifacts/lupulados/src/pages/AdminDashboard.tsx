import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useLocation } from "wouter";
import { Archive, CheckCircle, Edit, LogOut, Plus, RefreshCw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import {
  SupabaseCommercialRepository,
  type AdminAuditLogEntry,
} from "@/domain/commercialRepository";
import {
  loadAdminCommercialData,
  refreshAfterAdminMutation,
  runSingleAdminMutation,
  type AdminCommercialData,
} from "@/domain/adminDataLoader";
import {
  deliveryToFormValues,
  extraToFormValues,
  getFirstZodError,
  parseDeliveryForm,
  parseDeliveryUpdateForm,
  parseExtraForm,
  parseExtraUpdateForm,
  parsePresentationForm,
  parsePresentationUpdateForm,
  parseProductForm,
  parseProductUpdateForm,
  parsePromotionForm,
  parsePromotionUpdateForm,
  parseWhatsAppForm,
  parseWhatsAppUpdateForm,
  presentationToFormValues,
  productToFormValues,
  promotionToFormValues,
  whatsAppToFormValues,
  type DeliveryFormValues,
  type ExtraFormValues,
  type PresentationFormValues,
  type ProductFormValues,
  type PromotionFormValues,
  type WhatsAppFormValues,
} from "@/domain/adminFormAdapters";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "@/domain/commercialTypes";

type AdminTab =
  | "summary"
  | "products"
  | "presentations"
  | "business"
  | "whatsapp"
  | "delivery"
  | "extras"
  | "promotions"
  | "activity";
type StatusFilter = "all" | "active" | "archived";

const emptyAdminData: AdminCommercialData = {
  products: [],
  presentations: [],
  deliveryOptions: [],
  extraOptions: [],
  promotions: [],
  whatsappChannels: [],
};

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

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const auth = useAdminAuth();
  const commercial = useCommercialData();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [productStatus, setProductStatus] = useState<StatusFilter>("all");
  const [presentationStatus, setPresentationStatus] = useState<StatusFilter>("all");
  const [deliveryStatus, setDeliveryStatus] = useState<StatusFilter>("all");
  const [extraStatus, setExtraStatus] = useState<StatusFilter>("all");
  const [promotionStatus, setPromotionStatus] = useState<StatusFilter>("all");
  const [whatsappStatus, setWhatsappStatus] = useState<StatusFilter>("all");
  const [adminData, setAdminData] = useState<AdminCommercialData>(emptyAdminData);
  const [audit, setAudit] = useState<AdminAuditLogEntry[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPresentation, setEditingPresentation] = useState<ProductPresentation | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryOption | null>(null);
  const [editingExtra, setEditingExtra] = useState<ExtraOption | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [editingWhatsApp, setEditingWhatsApp] = useState<WhatsAppChannel | null>(null);
  const repository = useMemo(() => {
    const client = getSupabaseClient();
    return client ? new SupabaseCommercialRepository(client) : null;
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!repository) return;
    setAdminLoading(true);
    try {
      setAdminData(await loadAdminCommercialData(repository));
    } catch (error) {
      toast({
        title: "No se pudieron cargar los datos administrativos",
        description: getFirstZodError(error, "Error inesperado."),
      });
    } finally {
      setAdminLoading(false);
    }
  }, [repository, toast]);

  useEffect(() => {
    if (auth.access === "admin") {
      void loadAdminData();
    }
  }, [auth.access, loadAdminData]);

  if (auth.access === "loading")
    return <AdminShell title="Cargando sesión">Verificando acceso administrativo...</AdminShell>;
  if (auth.access === "unconfigured") {
    return (
      <AdminShell title="Configuración pendiente">
        Supabase no está configurado. Definí `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
      </AdminShell>
    );
  }
  if (auth.access === "anonymous") {
    navigate("/admin/login", { replace: true });
    return null;
  }
  if (auth.access === "unauthorized") {
    return (
      <AdminShell title="Acceso no autorizado">
        Tu sesión no tiene un rol ADMIN activo en `public.admin_users`.
      </AdminShell>
    );
  }

  const refreshEverything = async () => {
    if (!repository) return;
    setAdminData(await refreshAfterAdminMutation(repository, commercial.refresh));
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    if (!repository) return false;
    const result = await runSingleAdminMutation(busyRef, setBusy, async () => {
      await action();
      await refreshEverything();
      toast({ title: success });
    }).catch((error) => {
      toast({
        title: "No se pudo guardar",
        description: getFirstZodError(error, "Error inesperado."),
      });
      return { ok: false as const };
    });

    if (!result.ok) {
      return false;
    }
    return true;
  };

  const loadAudit = async () => {
    if (!repository) return;
    setAuditLoading(true);
    try {
      setAudit(await repository.listAuditLog());
    } catch (error) {
      toast({
        title: "No se pudo cargar la actividad",
        description: getFirstZodError(error, "Error inesperado."),
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const products = adminData.products
    .filter((product) => matchesProductSearch(product, search))
    .filter((product) => matchesStatus(product.status === "active", productStatus));
  const presentations = adminData.presentations.filter((item) =>
    matchesStatus(item.active, presentationStatus),
  );
  const deliveryOptions = adminData.deliveryOptions.filter((item) =>
    matchesStatus(item.active, deliveryStatus),
  );
  const extraOptions = adminData.extraOptions.filter((item) =>
    matchesStatus(item.active, extraStatus),
  );
  const promotions = adminData.promotions.filter((item) =>
    matchesStatus(item.active, promotionStatus),
  );
  const whatsappChannels = adminData.whatsappChannels.filter((item) =>
    matchesStatus(item.active, whatsappStatus),
  );

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lupulados ADMIN</h1>
            <p className="text-sm text-muted-foreground">
              {auth.user?.email} · fuente pública: {commercial.source}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || adminLoading}
              onClick={() => void refreshEverything()}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refrescar
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void auth.signOut().then(() => navigate("/admin/login", { replace: true }))
              }
            >
              <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {adminLoading && (
          <p className="mb-4 text-sm text-muted-foreground">Cargando datos administrativos...</p>
        )}
        <Tabs defaultValue="summary">
          <TabsList className="h-auto flex flex-wrap justify-start bg-card border border-white/10">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary">
            <MetricGrid
              metrics={[
                [
                  "Productos activos",
                  adminData.products.filter((product) => product.status === "active").length,
                ],
                [
                  "Productos archivados",
                  adminData.products.filter((product) => product.status === "archived").length,
                ],
                [
                  "Presentaciones activas",
                  adminData.presentations.filter((item) => item.active).length,
                ],
                [
                  "WhatsApp activos",
                  adminData.whatsappChannels.filter((item) => item.active).length,
                ],
                ["Promociones activas", adminData.promotions.filter((item) => item.active).length],
              ]}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o ID"
                className="max-w-sm bg-card border-white/10"
              />
              <StatusFilterControl value={productStatus} onChange={setProductStatus} />
            </div>
            <ProductForm
              key={editingProduct?.id ?? "new-product"}
              disabled={busy}
              initial={editingProduct ? productToFormValues(editingProduct) : undefined}
              onCancel={editingProduct ? () => setEditingProduct(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingProduct
                      ? repository!.updateProduct(editingProduct.id, parseProductUpdateForm(input))
                      : repository!.createProduct(parseProductForm(input)),
                  mode === "edit" ? "Producto actualizado" : "Producto creado",
                ).then((ok) => {
                  if (ok) setEditingProduct(null);
                  return ok;
                })
              }
            />
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
                  onEdit={() => setEditingProduct(product)}
                  onArchive={() =>
                    confirmArchive(product.name) &&
                    void run(() => repository!.archiveProduct(product.id), "Producto archivado")
                  }
                  onRestore={() =>
                    run(() => repository!.restoreProduct(product.id), "Producto restaurado")
                  }
                />,
              ]}
            />
          </TabsContent>

          <TabsContent value="presentations" className="space-y-4">
            <ListToolbar status={presentationStatus} onStatusChange={setPresentationStatus} />
            <PresentationForm
              key={editingPresentation?.id ?? "new-presentation"}
              products={adminData.products}
              disabled={busy}
              initial={
                editingPresentation ? presentationToFormValues(editingPresentation) : undefined
              }
              onCancel={editingPresentation ? () => setEditingPresentation(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingPresentation
                      ? repository!.updatePresentation(
                          editingPresentation.id,
                          parsePresentationUpdateForm(input, adminData.products),
                        )
                      : repository!.createPresentation(
                          parsePresentationForm(input, adminData.products),
                        ),
                  mode === "edit" ? "Presentación actualizada" : "Presentación creada",
                ).then((ok) => {
                  if (ok) setEditingPresentation(null);
                  return ok;
                })
              }
            />
            <AdminTable
              rows={presentations}
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
                  onEdit={() => setEditingPresentation(item)}
                  onArchive={() =>
                    confirmArchive(item.label) &&
                    void run(
                      () => repository!.archivePresentation(item.id),
                      "Presentación archivada",
                    )
                  }
                  onRestore={() =>
                    run(() => repository!.restorePresentation(item.id), "Presentación restaurada")
                  }
                />,
              ]}
            />
          </TabsContent>

          <TabsContent value="business">
            <BusinessForm
              profile={commercial.snapshot.businessProfile}
              disabled={busy}
              onSubmit={(input) =>
                run(
                  () => repository!.updateBusinessProfile(input),
                  "Información comercial actualizada",
                )
              }
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <ListToolbar status={whatsappStatus} onStatusChange={setWhatsappStatus} />
            <WhatsAppForm
              key={editingWhatsApp?.id ?? "new-whatsapp"}
              disabled={busy}
              initial={editingWhatsApp ? whatsAppToFormValues(editingWhatsApp) : undefined}
              onCancel={editingWhatsApp ? () => setEditingWhatsApp(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingWhatsApp
                      ? repository!.updateWhatsAppChannel(
                          editingWhatsApp.id,
                          parseWhatsAppUpdateForm(input),
                        )
                      : repository!.createWhatsAppChannel(parseWhatsAppForm(input)),
                  mode === "edit" ? "WhatsApp actualizado" : "WhatsApp creado",
                ).then((ok) => {
                  if (ok) setEditingWhatsApp(null);
                  return ok;
                })
              }
            />
            <AdminTable
              rows={whatsappChannels}
              columns={["ID", "Teléfono", "Principal", "Activo", "Acciones"]}
              render={(channel) => [
                channel.id,
                `${channel.label}: ${channel.phoneDisplay}`,
                channel.isPrimary ? "sí" : "no",
                channel.active ? "sí" : "no",
                <div key="actions" className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !channel.active}
                    onClick={() =>
                      run(
                        () => repository!.setPrimaryWhatsAppChannel(channel.id),
                        "WhatsApp principal actualizado",
                      )
                    }
                  >
                    Principal
                  </Button>
                  <RowActions
                    archived={!channel.active}
                    disabled={busy}
                    onEdit={() => setEditingWhatsApp(channel)}
                    onArchive={() =>
                      confirmArchive(channel.label) &&
                      void run(
                        () => repository!.archiveWhatsAppChannel(channel.id),
                        "WhatsApp desactivado",
                      )
                    }
                    onRestore={() =>
                      run(
                        () => repository!.updateWhatsAppChannel(channel.id, { active: true }),
                        "WhatsApp restaurado",
                      )
                    }
                  />
                </div>,
              ]}
            />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <ListToolbar status={deliveryStatus} onStatusChange={setDeliveryStatus} />
            <DeliveryForm
              key={editingDelivery?.id ?? "new-delivery"}
              disabled={busy}
              initial={editingDelivery ? deliveryToFormValues(editingDelivery) : undefined}
              onCancel={editingDelivery ? () => setEditingDelivery(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingDelivery
                      ? repository!.updateDeliveryOption(
                          editingDelivery.id,
                          parseDeliveryUpdateForm(input),
                        )
                      : repository!.createDeliveryOption(parseDeliveryForm(input)),
                  mode === "edit" ? "Entrega actualizada" : "Opción de entrega creada",
                ).then((ok) => {
                  if (ok) setEditingDelivery(null);
                  return ok;
                })
              }
            />
            <ToggleTable
              rows={deliveryOptions}
              disabled={busy}
              onEdit={(row) => setEditingDelivery(row)}
              onArchive={(row) =>
                confirmArchive(row.label) &&
                void run(() => repository!.archiveDeliveryOption(row.id), "Entrega desactivada")
              }
              onRestore={(row) =>
                run(() => repository!.restoreDeliveryOption(row.id), "Entrega restaurada")
              }
            />
          </TabsContent>

          <TabsContent value="extras" className="space-y-4">
            <ListToolbar status={extraStatus} onStatusChange={setExtraStatus} />
            <ExtraForm
              key={editingExtra?.id ?? "new-extra"}
              disabled={busy}
              initial={editingExtra ? extraToFormValues(editingExtra) : undefined}
              onCancel={editingExtra ? () => setEditingExtra(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingExtra
                      ? repository!.updateExtraOption(editingExtra.id, parseExtraUpdateForm(input))
                      : repository!.createExtraOption(parseExtraForm(input)),
                  mode === "edit" ? "Extra actualizado" : "Extra creado",
                ).then((ok) => {
                  if (ok) setEditingExtra(null);
                  return ok;
                })
              }
            />
            <ToggleTable
              rows={extraOptions}
              disabled={busy}
              onEdit={(row) => setEditingExtra(row)}
              onArchive={(row) =>
                confirmArchive(row.label) &&
                void run(() => repository!.archiveExtraOption(row.id), "Extra desactivado")
              }
              onRestore={(row) =>
                run(() => repository!.restoreExtraOption(row.id), "Extra restaurado")
              }
            />
          </TabsContent>

          <TabsContent value="promotions" className="space-y-4">
            <ListToolbar status={promotionStatus} onStatusChange={setPromotionStatus} />
            <PromotionForm
              key={editingPromotion?.id ?? "new-promotion"}
              disabled={busy}
              initial={editingPromotion ? promotionToFormValues(editingPromotion) : undefined}
              onCancel={editingPromotion ? () => setEditingPromotion(null) : undefined}
              onSubmit={(input, mode) =>
                run(
                  () =>
                    mode === "edit" && editingPromotion
                      ? repository!.updatePromotion(
                          editingPromotion.id,
                          parsePromotionUpdateForm(input),
                        )
                      : repository!.createPromotion(parsePromotionForm(input)),
                  mode === "edit" ? "Promoción actualizada" : "Promoción creada",
                ).then((ok) => {
                  if (ok) setEditingPromotion(null);
                  return ok;
                })
              }
            />
            <AdminTable
              rows={promotions}
              columns={["Código", "Tipo", "Valor", "Activo", "Acciones"]}
              render={(promotion) => [
                promotion.code,
                promotion.type,
                promotion.value,
                promotion.active ? "sí" : "no",
                <RowActions
                  key="actions"
                  archived={!promotion.active}
                  disabled={busy}
                  onEdit={() => setEditingPromotion(promotion)}
                  onArchive={() =>
                    confirmArchive(promotion.code) &&
                    void run(
                      () => repository!.archivePromotion(promotion.id),
                      "Promoción desactivada",
                    )
                  }
                  onRestore={() =>
                    run(() => repository!.restorePromotion(promotion.id), "Promoción restaurada")
                  }
                />,
              ]}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Button variant="outline" disabled={auditLoading} onClick={() => void loadAudit()}>
              <RefreshCw className="w-4 h-4 mr-2" />{" "}
              {auditLoading ? "Cargando..." : "Cargar actividad reciente"}
            </Button>
            <AdminTable
              rows={audit}
              columns={["Fecha", "Tabla", "Operación", "Registro"]}
              render={(entry) => [
                formatArgentinaDate(entry.createdAt),
                entry.tableName,
                entry.operation,
                entry.recordId ?? "-",
              ]}
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

function AdminTable<T>({
  rows,
  columns,
  render,
}: {
  rows: T[];
  columns: string[];
  render: (row: T) => ReactNode[];
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="p-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/10">
              {render(row).map((cell, cellIndex) => (
                <td key={cellIndex} className="p-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  archived,
  disabled,
  onEdit,
  onArchive,
  onRestore,
}: {
  archived: boolean;
  disabled: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={disabled} onClick={onEdit}>
        <Edit className="w-4 h-4 mr-1" /> Editar
      </Button>
      {archived ? (
        <Button size="sm" variant="outline" disabled={disabled} onClick={onRestore}>
          <CheckCircle className="w-4 h-4 mr-1" /> Restaurar
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={disabled} onClick={onArchive}>
          <Archive className="w-4 h-4 mr-1" /> Archivar
        </Button>
      )}
    </div>
  );
}

function ProductForm({
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

function PresentationForm({
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
        const input = Object.fromEntries(new FormData(event.currentTarget));
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
        if (ok && mode === "create") event.currentTarget.reset();
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

function BusinessForm({
  profile,
  disabled,
  onSubmit,
}: {
  profile: ReturnType<typeof useCommercialData>["snapshot"]["businessProfile"];
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

function WhatsAppForm({
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

function DeliveryForm({
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
        const input = Object.fromEntries(new FormData(event.currentTarget));
        try {
          void (mode === "edit" ? parseDeliveryUpdateForm(input) : parseDeliveryForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Entrega inválida."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") event.currentTarget.reset();
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

function ExtraForm({
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

function PromotionForm({
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
        const input = Object.fromEntries(new FormData(event.currentTarget));
        try {
          void (mode === "edit" ? parsePromotionUpdateForm(input) : parsePromotionForm(input));
          setError("");
        } catch (error) {
          setError(getFirstZodError(error, "Promoción inválida."));
          return;
        }
        const ok = await onSubmit(input, mode);
        if (ok && mode === "create") event.currentTarget.reset();
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

function AdminForm({
  title,
  error,
  disabled,
  submitLabel,
  children,
  onCancel,
  onSubmit,
}: {
  title: string;
  error: string;
  disabled: boolean;
  submitLabel: string;
  children: ReactNode;
  onCancel?: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  const errorId = error ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-error` : undefined;
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-white/10 rounded-lg p-4"
      onSubmit={onSubmit}
      aria-describedby={errorId}
    >
      <h2 className="md:col-span-4 text-lg font-semibold">{title}</h2>
      {children}
      {error && (
        <p id={errorId} className="md:col-span-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <div className="md:col-span-4 flex flex-wrap gap-2">
        <Button disabled={disabled} className="bg-primary text-black hover:bg-amber-500">
          {submitLabel === "Guardar cambios" ? (
            <Save className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={disabled} onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

function ToggleTable<T extends { id: string; label: string; price: number; active: boolean }>({
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

function ListToolbar({
  status,
  onStatusChange,
}: {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex justify-end">
      <StatusFilterControl value={status} onChange={onStatusChange} />
    </div>
  );
}

function StatusFilterControl({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["all", "active", "archived"] as const).map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          variant={value === status ? "default" : "outline"}
          onClick={() => onChange(status)}
        >
          {status === "all" ? "Todos" : status === "active" ? "Activos" : "Archivados"}
        </Button>
      ))}
    </div>
  );
}

function Field({
  name,
  label,
  className,
  required = true,
  ...props
}: { name: string; label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        required={required}
        aria-required={required}
        className="bg-black/40 border-white/10 text-white disabled:opacity-70"
        {...props}
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        className="h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function matchesProductSearch(product: Product, search: string) {
  const term = search.trim().toLowerCase();
  return (
    !term || product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)
  );
}

function matchesStatus(active: boolean, filter: StatusFilter) {
  if (filter === "all") return true;
  return filter === "active" ? active : !active;
}

function confirmArchive(label: string) {
  return window.confirm(`¿Confirmás archivar o desactivar ${label}?`);
}

function formatArgentinaDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}
