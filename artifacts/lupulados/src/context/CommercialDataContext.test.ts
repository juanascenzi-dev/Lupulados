import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "@/domain/commercialData";
import { resolveCommercialSnapshot } from "./CommercialDataContext";

describe("resolveCommercialSnapshot", () => {
  it("uses Supabase source when repository returns a valid snapshot", async () => {
    await expect(resolveCommercialSnapshot({ getCommercialSnapshot: async () => commercialSnapshot } as never)).resolves.toMatchObject({ source: "supabase" });
  });

  it("uses static source when Supabase is absent", async () => {
    await expect(resolveCommercialSnapshot(null)).resolves.toMatchObject({ source: "static" });
  });

  it("uses static source when Supabase throws", async () => {
    await expect(resolveCommercialSnapshot({ getCommercialSnapshot: async () => { throw new Error("offline"); } } as never)).resolves.toMatchObject({ source: "static" });
  });

  it("uses static source when Supabase returns an invalid empty snapshot", async () => {
    await expect(resolveCommercialSnapshot({ getCommercialSnapshot: async () => ({ ...commercialSnapshot, products: [] }) } as never)).resolves.toMatchObject({ source: "static" });
  });
});
