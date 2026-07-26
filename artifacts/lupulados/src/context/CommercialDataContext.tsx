import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { commercialSnapshot } from "@/domain/commercialData";
import { buildBeerCatalog, buildBusinessConfig, buildOrderTypeOptions } from "@/domain/commercialAdapters";
import { StaticCommercialRepository, SupabaseCommercialRepository, type CommercialRepository } from "@/domain/commercialRepository";
import type { CommercialSnapshot } from "@/domain/commercialTypes";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export type CommercialDataSource = "supabase" | "static";

export interface CommercialDataState {
  snapshot: CommercialSnapshot;
  source: CommercialDataSource;
  loading: boolean;
  error: Error | null;
  supabaseConfigured: boolean;
  refresh: () => Promise<void>;
}

const CommercialDataContext = createContext<CommercialDataState | undefined>(undefined);

const staticRepository = new StaticCommercialRepository();

export async function resolveCommercialSnapshot(repository: CommercialRepository | null) {
  if (!repository) {
    return { snapshot: commercialSnapshot, source: "static" as const, error: null };
  }

  try {
    const snapshot = await repository.getCommercialSnapshot();
    if (snapshot.products.length === 0 || snapshot.productPresentations.length === 0) {
      throw new Error("Supabase no devolvio catalogo publico");
    }
    return { snapshot, source: "supabase" as const, error: null };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[commercial-data] usando fallback estatico", error);
    }
    return {
      snapshot: await staticRepository.getCommercialSnapshot(),
      source: "static" as const,
      error: error instanceof Error ? error : new Error("No se pudo leer Supabase"),
    };
  }
}

export function CommercialDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const config = getSupabasePublicConfig();
  const repository = useMemo(() => {
    const client = getSupabaseClient();
    return client ? new SupabaseCommercialRepository(client) : null;
  }, []);

  const query = useQuery({
    queryKey: ["commercial-snapshot"],
    queryFn: () => resolveCommercialSnapshot(repository),
    staleTime: 60_000,
  });

  const value: CommercialDataState = {
    snapshot: query.data?.snapshot ?? commercialSnapshot,
    source: query.data?.source ?? "static",
    loading: query.isLoading,
    error: query.data?.error ?? (query.error instanceof Error ? query.error : null),
    supabaseConfigured: config.configured,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commercial-snapshot"] });
    },
  };

  return <CommercialDataContext.Provider value={value}>{children}</CommercialDataContext.Provider>;
}

export function useCommercialData() {
  const context = useContext(CommercialDataContext);
  if (!context) {
    throw new Error("useCommercialData must be used within CommercialDataProvider");
  }
  return context;
}

export function useCommercialDerivedData() {
  const commercialData = useCommercialData();
  return useMemo(() => {
    const business = buildBusinessConfig(commercialData.snapshot);
    return {
      ...commercialData,
      beerCatalog: buildBeerCatalog(commercialData.snapshot),
      orderTypeOptions: buildOrderTypeOptions(commercialData.snapshot),
      ...business,
    };
  }, [commercialData]);
}
