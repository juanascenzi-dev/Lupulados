import { useLocation } from "wouter";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import {
  businessProfileToFormValues,
  deliveryToFormValues,
  extraToFormValues,
  parseBusinessProfileForm,
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
} from "@/domain/adminFormAdapters";
import { confirmArchive, formatArgentinaDate, tabs } from "@/domain/adminDashboardHelpers";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { MetricGrid } from "@/components/admin/MetricGrid";
import { AdminTable } from "@/components/admin/AdminTable";
import { RowActions } from "@/components/admin/RowActions";
import { ToggleTable } from "@/components/admin/ToggleTable";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { StatusFilterControl } from "@/components/admin/StatusFilterControl";
import { ProductForm } from "@/components/admin/forms/ProductForm";
import { PresentationForm } from "@/components/admin/forms/PresentationForm";
import { BusinessForm } from "@/components/admin/forms/BusinessForm";
import { WhatsAppForm } from "@/components/admin/forms/WhatsAppForm";
import { DeliveryForm } from "@/components/admin/forms/DeliveryForm";
import { ExtraForm } from "@/components/admin/forms/ExtraForm";
import { PromotionForm } from "@/components/admin/forms/PromotionForm";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const auth = useAdminAuth();
  const commercial = useCommercialData();
  const {
    repository,
    busy,
    adminLoading,
    auditLoading,
    search,
    setSearch,
    productStatus,
    setProductStatus,
    presentationStatus,
    setPresentationStatus,
    deliveryStatus,
    setDeliveryStatus,
    extraStatus,
    setExtraStatus,
    promotionStatus,
    setPromotionStatus,
    whatsappStatus,
    setWhatsappStatus,
    adminData,
    audit,
    products,
    presentations,
    deliveryOptions,
    extraOptions,
    promotions,
    whatsappChannels,
    editingProduct,
    setEditingProduct,
    editingPresentation,
    setEditingPresentation,
    editingDelivery,
    setEditingDelivery,
    editingExtra,
    setEditingExtra,
    editingPromotion,
    setEditingPromotion,
    editingWhatsApp,
    setEditingWhatsApp,
    refreshEverything,
    run,
    loadAudit,
  } = useAdminDashboardData(auth.access, commercial.refresh);

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

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-background text-white">
      <AdminDashboardHeader
        email={auth.user?.email}
        source={commercial.source}
        busy={busy}
        adminLoading={adminLoading}
        onRefresh={() => void refreshEverything()}
        onSignOut={() =>
          void auth.signOut().then(() => navigate("/admin/login", { replace: true }))
        }
      />

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
              profile={businessProfileToFormValues(commercial.snapshot.businessProfile)}
              disabled={busy}
              onSubmit={(input) =>
                run(
                  () => repository!.updateBusinessProfile(parseBusinessProfileForm(input)),
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
