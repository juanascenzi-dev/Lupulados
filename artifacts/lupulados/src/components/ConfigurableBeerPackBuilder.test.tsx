import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beerCatalog } from "@/domain/beerCatalog";
import { ConfigurableBeerPackBuilder } from "./ConfigurableBeerPackBuilder";

describe("ConfigurableBeerPackBuilder", () => {
  it("shows an unavailable message when there are no styles with porrón 500ml pricing", () => {
    render(<ConfigurableBeerPackBuilder beers={[]} onAddPacks={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Pack de porrones no disponible");
  });

  it("keeps the add button disabled and shows a warning while the pack is incomplete", () => {
    render(<ConfigurableBeerPackBuilder beers={beerCatalog} onAddPacks={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Agregar 1 pack al carrito/ })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Completa todos los packs para agregarlos al carrito.",
    );
  });

  it("completes a pack with a single style and adds it to the cart", async () => {
    const user = userEvent.setup();
    const onAddPacks = vi.fn();
    const onAdded = vi.fn();
    render(
      <ConfigurableBeerPackBuilder beers={beerCatalog} onAddPacks={onAddPacks} onAdded={onAdded} />,
    );

    const increaseBlonde = screen.getByRole("button", { name: "Sumar Blonde Ale al Pack 1" });
    for (let i = 0; i < 6; i += 1) {
      await user.click(increaseBlonde);
    }

    const addButton = screen.getByRole("button", { name: /Agregar 1 pack al carrito/ });
    expect(addButton).toBeEnabled();
    await user.click(addButton);

    expect(onAddPacks).toHaveBeenCalledTimes(1);
    const [lines] = onAddPacks.mock.calls[0] as [Array<{ item: unknown; qty: number }>];
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(1);
    expect(onAdded).toHaveBeenCalledWith(expect.stringContaining("1 packs configurables"));

    // Se resetea a 1 pack vacío después de agregar.
    expect(screen.getByRole("button", { name: /Agregar 1 pack al carrito/ })).toBeDisabled();
  }, 15000);

  it("asks for confirmation before discarding a configured pack when reducing the pack count", async () => {
    const user = userEvent.setup();
    render(<ConfigurableBeerPackBuilder beers={beerCatalog} onAddPacks={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Sumar cantidad de packs" }));
    await user.click(screen.getByRole("tab", { name: /Pack 2 de 2/ }));
    await user.click(screen.getByRole("button", { name: "Sumar Blonde Ale al Pack 2" }));

    await user.click(screen.getByRole("button", { name: "Restar cantidad de packs" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText("Vas a descartar packs con selecciones cargadas."),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  }, 15000);

  it("cancels the confirmation dialog without changing the pack count", async () => {
    const user = userEvent.setup();
    render(<ConfigurableBeerPackBuilder beers={beerCatalog} onAddPacks={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Sumar cantidad de packs" }));
    await user.click(screen.getByRole("tab", { name: /Pack 2 de 2/ }));
    await user.click(screen.getByRole("button", { name: "Sumar Blonde Ale al Pack 2" }));
    await user.click(screen.getByRole("button", { name: "Restar cantidad de packs" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  }, 15000);
});
