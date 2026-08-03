import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAdmin } from "@/test/renderWithProviders";
import { createFakeSupabaseAdminClient } from "@/test/supabaseAdminMock";
import AdminLogin from "./AdminLogin";

const { getSupabaseClient } = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({ getSupabaseClient }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabasePublicConfig: () => ({
    configured: true,
    url: "https://test.supabase.co",
    publishableKey: "test-anon-key",
  }),
}));

describe("AdminLogin", () => {
  it("llama a signInWithPassword con las credenciales y redirige a /admin", async () => {
    const fakeClient = createFakeSupabaseAdminClient({ initialSession: null, isAdmin: true });
    getSupabaseClient.mockReturnValue(fakeClient);

    const user = userEvent.setup();
    const { history } = renderAdmin(<AdminLogin />, { path: "/admin/login" });

    await user.type(screen.getByLabelText("Email"), "admin@lupulados.test");
    await user.type(screen.getByLabelText("Contraseña"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(fakeClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "admin@lupulados.test",
        password: "supersecret",
      }),
    );
    await waitFor(() => expect(history).toContain("/admin"));
  });
});
