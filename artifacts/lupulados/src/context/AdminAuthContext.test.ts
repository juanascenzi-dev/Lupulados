import { describe, expect, it } from "vitest";
import { resolveAdminAccessState } from "./AdminAuthContext";

describe("resolveAdminAccessState", () => {
  it("redirects users without session to anonymous state", () => {
    expect(resolveAdminAccessState({ configured: true, hasSession: false, isAdmin: null })).toBe("anonymous");
  });

  it("denies authenticated non-admin users", () => {
    expect(resolveAdminAccessState({ configured: true, hasSession: true, isAdmin: false })).toBe("unauthorized");
  });

  it("allows active admin users", () => {
    expect(resolveAdminAccessState({ configured: true, hasSession: true, isAdmin: true })).toBe("admin");
  });

  it("denies inactive admin users", () => {
    expect(resolveAdminAccessState({ configured: true, hasSession: true, isAdmin: null })).toBe("unauthorized");
  });

  it("reports missing Supabase configuration", () => {
    expect(resolveAdminAccessState({ configured: false, hasSession: false, isAdmin: null })).toBe("unconfigured");
  });
});
