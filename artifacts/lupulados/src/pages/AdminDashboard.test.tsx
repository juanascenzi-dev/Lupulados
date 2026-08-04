import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAdmin } from "@/test/renderWithProviders";
import { createFakeSupabaseAdminClient, FAKE_ADMIN_SESSION } from "@/test/supabaseAdminMock";
import type { ProductRow } from "@/domain/commercialRepositoryRows";
import AdminDashboard from "./AdminDashboard";

const { getSupabaseClient } = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabasePublicConfig: () => ({
    configured: true,
    url: "https://test.supabase.co",
    publishableKey: "test-anon-key",
  }),
}));

const SEED_PRODUCT: ProductRow = {
  id: "blonde-ale",
  slug: "blonde-ale",
  name: "Blonde Ale",
  description: "Cerveza rubia suave",
  style: "Blonde Ale",
  category: "beer",
  image_url: "https://example.com/blonde.jpg",
  status: "active",
  sort_order: 1,
  abv: 5,
  ibu: 20,
  badge: null,
};

describe("AdminDashboard", () => {
  it("carga los productos existentes, crea uno nuevo y archiva el existente", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fakeClient = createFakeSupabaseAdminClient({
      initialSession: FAKE_ADMIN_SESSION,
      isAdmin: true,
      products: [SEED_PRODUCT],
    });
    getSupabaseClient.mockReturnValue(fakeClient);

    const user = userEvent.setup();
    renderAdmin(<AdminDashboard />, { path: "/admin" });

    await user.click(await screen.findByRole("tab", { name: "Productos" }));
    await screen.findByText("Blonde Ale");

    await user.type(screen.getByLabelText("ID"), "ipa-test");
    await user.type(screen.getByLabelText("Slug"), "ipa-test");
    await user.type(screen.getByLabelText("Nombre"), "IPA de Test");
    await user.type(screen.getByLabelText("Estilo"), "IPA");
    await user.type(screen.getByLabelText("Descripción"), "Cerveza de prueba");
    await user.type(screen.getByLabelText("URL imagen"), "https://example.com/ipa-test.jpg");
    await user.click(screen.getByRole("button", { name: "Crear producto" }));

    await screen.findByText("IPA de Test");

    const blondeAleRow = () => {
      const row = screen.getByText("Blonde Ale").closest("tr");
      if (!row) throw new Error("No se encontro la fila de Blonde Ale");
      return row;
    };
    await user.click(within(blondeAleRow()).getByRole("button", { name: "Archivar" }));

    await waitFor(() =>
      expect(within(blondeAleRow()).getByRole("button", { name: "Restaurar" })).toBeInTheDocument(),
    );
  }, 15000);
});
