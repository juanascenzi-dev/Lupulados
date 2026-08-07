import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { reportError } from "@/lib/monitoring/sentry";

export type AdminAccess = "loading" | "unconfigured" | "anonymous" | "unauthorized" | "admin";

export function resolveAdminAccessState(input: {
  configured: boolean;
  hasSession: boolean;
  isAdmin: boolean | null;
}) {
  if (!input.configured) return "unconfigured" as const;
  if (!input.hasSession) return "anonymous" as const;
  return input.isAdmin === true ? ("admin" as const) : ("unauthorized" as const);
}

interface AdminAuthState {
  access: AdminAccess;
  session: Session | null;
  user: User | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const config = getSupabasePublicConfig();
  const client = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<AdminAccess>(config.configured ? "loading" : "unconfigured");
  const [error, setError] = useState<string | null>(null);

  const refreshAdminStatus = useCallback(async () => {
    if (!client) {
      setAccess("unconfigured");
      return;
    }

    const sessionResponse = await client.auth.getSession();
    const currentSession = sessionResponse.data.session;
    setSession(currentSession);

    if (!currentSession) {
      setAccess("anonymous");
      return;
    }

    const { data, error: rpcError } = await client.rpc("is_admin");
    if (rpcError) {
      reportError(rpcError, { scope: "admin-rpc-is-admin" });
      setError("No se pudo verificar el rol administrativo.");
      setAccess("unauthorized");
      return;
    }

    setError(null);
    setAccess(data === true ? "admin" : "unauthorized");
  }, [client]);

  useEffect(() => {
    void refreshAdminStatus();
    if (!client) return undefined;

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void refreshAdminStatus();
    });
    return () => data.subscription.unsubscribe();
  }, [client, refreshAdminStatus]);

  const signIn: AdminAuthState["signIn"] = async (email, password) => {
    if (!client) return { ok: false, message: "Supabase no esta configurado." };
    setAccess("loading");
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      setAccess("anonymous");
      return { ok: false, message: "Email o contrasena invalidos." };
    }
    await refreshAdminStatus();
    return { ok: true };
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
    setSession(null);
    setAccess("anonymous");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        access,
        session,
        user: session?.user ?? null,
        error,
        signIn,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
