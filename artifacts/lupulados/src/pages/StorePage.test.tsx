import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithCart } from "@/test/renderWithProviders";
import StorePage from "./StorePage";

describe("StorePage", () => {
  it("renders the catalog and lets you add a product to the cart", async () => {
    const user = userEvent.setup();
    renderWithCart(<StorePage />);

    expect(screen.getByRole("button", { name: /Carrito/ })).toHaveTextContent(/^Carrito$/);

    const card = screen.getByText("Blonde Ale").closest("article") as HTMLElement;
    await user.click(within(card).getByRole("button", { name: "Agregar" }));

    expect(await within(card).findByText(/^Agregaste/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Carrito/ })).toHaveTextContent("Carrito1");
  }, 15000); // renderiza el catálogo completo; bajo instrumentación de coverage supera el timeout default (ver CHANGELOG, mismo caso que ArmaTuPedido.test.tsx)

  it("shows a no-results message for a search with no matches, and clearing filters restores the catalog", async () => {
    const user = userEvent.setup();
    renderWithCart(<StorePage />);

    await user.type(screen.getByLabelText("Buscar productos"), "zzznoexisteesteproducto");

    expect(screen.getByText("No encontramos productos con esos filtros")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Limpiar filtros/ }));

    expect(screen.queryByText("No encontramos productos con esos filtros")).not.toBeInTheDocument();
    expect(screen.getByText("Blonde Ale")).toBeInTheDocument();
  }, 15000); // renderiza el catálogo completo; bajo instrumentación de coverage supera el timeout default (ver CHANGELOG, mismo caso que ArmaTuPedido.test.tsx)

  it("opens the checkout modal and closes it with Escape, returning focus to the trigger", async () => {
    const user = userEvent.setup();
    renderWithCart(<StorePage />);

    await user.click(screen.getByRole("button", { name: /Carrito/ }));
    expect(await screen.findByRole("dialog", { name: "Checkout" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Checkout" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Carrito/ })).toHaveFocus();
  }, 15000); // renderiza el catálogo completo; bajo instrumentación de coverage supera el timeout default (ver CHANGELOG, mismo caso que ArmaTuPedido.test.tsx)

  it("opens the pack builder modal and closes it with Escape, returning focus to the trigger", async () => {
    const user = userEvent.setup();
    renderWithCart(<StorePage />);

    await user.click(screen.getByRole("button", { name: "Personalizar pack" }));
    expect(
      await screen.findByRole("dialog", { name: "Configurar pack de porrones" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Configurar pack de porrones" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Personalizar pack" })).toHaveFocus();
  }, 15000); // renderiza el catálogo completo; bajo instrumentación de coverage supera el timeout default (ver CHANGELOG, mismo caso que ArmaTuPedido.test.tsx)
});
