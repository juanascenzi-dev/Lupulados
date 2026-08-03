import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { AdminAccess } from "@/context/AdminAuthContext";
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
import { getFirstZodError } from "@/domain/adminFormAdapters";
import { reportError } from "@/lib/monitoring/sentry";
import {
  emptyAdminData,
  matchesProductSearch,
  matchesStatus,
  type StatusFilter,
} from "@/domain/adminDashboardHelpers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "@/domain/commercialTypes";

/**
 * Encapsulates AdminDashboard's local state (loading flags, filters, edit
 * targets), the Supabase repository memo, and the load/refresh/mutate
 * closures used to drive every entity's create/update/archive/restore flow.
 */
export function useAdminDashboardData(
  adminAccess: AdminAccess,
  refreshPublicSnapshot: () => Promise<void>,
) {
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
      reportError(error, { scope: "admin-load-data" });
      toast({
        title: "No se pudieron cargar los datos administrativos",
        description: getFirstZodError(error, "Error inesperado."),
      });
    } finally {
      setAdminLoading(false);
    }
  }, [repository, toast]);

  useEffect(() => {
    if (adminAccess === "admin") {
      void loadAdminData();
    }
  }, [adminAccess, loadAdminData]);

  const refreshEverything = async () => {
    if (!repository) return;
    setAdminData(await refreshAfterAdminMutation(repository, refreshPublicSnapshot));
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    if (!repository) return false;
    const result = await runSingleAdminMutation(busyRef, setBusy, async () => {
      await action();
      await refreshEverything();
      toast({ title: success });
    }).catch((error) => {
      reportError(error, { scope: "admin-mutation" });
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
      reportError(error, { scope: "admin-load-audit" });
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

  return {
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
  };
}
