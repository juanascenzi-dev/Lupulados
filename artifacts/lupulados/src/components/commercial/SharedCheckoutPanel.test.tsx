import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithCart } from "@/test/renderWithProviders";
import { useCart } from "@/context/CartContext";
import { commercialSnapshot } from "@/domain/commercialData";
import { formatPrice } from "@/domain/format";
import { createCommercialCartItem } from "@/domain/productCatalog";
import type { CommercialSnapshot, Promotion } from "@/domain/commercialTypes";
import { SharedCheckoutPanel } from "./SharedCheckoutPanel";

// Ítem real del catálogo demo (no inventado): el carrito reconcilia precio/label
// contra el snapshot vigente, así que un ítem con datos inventados no sobrevive.
const testProduct = commercialSnapshot.products.find((product) => product.id === "blonde-ale")!;
const testPresentation = commercialSnapshot.productPresentations.find(
  (presentation) =>
    presentation.productId === "blonde-ale" && presentation.presentationType === "barril20L",
)!;
const testCartLine = createCommercialCartItem(testProduct, testPresentation);
const testItemPrice = testPresentation.unitPrice;

function AddTestItem() {
  const { addItem } = useCart();
  useEffect(() => {
    addItem(testCartLine, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function renderCheckout(snapshot?: CommercialSnapshot) {
  return renderWithCart(
    <>
      <AddTestItem />
      <SharedCheckoutPanel />
    </>,
    { snapshot },
  );
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Nombre/), "Juan Perez");
  fireEvent.change(screen.getByLabelText(/Fecha/), { target: { value: tomorrow() } });
}

function snapshotWithPromotions(promotions: Promotion[]): CommercialSnapshot {
  return { ...commercialSnapshot, promotions };
}

describe("SharedCheckoutPanel", () => {
  it("shows an empty-cart message and a disabled WhatsApp button when there are no items", () => {
    renderWithCart(<SharedCheckoutPanel />);

    expect(screen.getByText("Todavía no agregaste productos.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preparar WhatsApp" })).toBeDisabled();
  });

  it("builds a valid WhatsApp link once the cart has items and required fields are filled", async () => {
    const user = userEvent.setup();
    renderCheckout();

    await fillRequiredFields(user);

    const link = await screen.findByRole("link", { name: "Preparar WhatsApp" });
    const href = link.getAttribute("href") ?? "";
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);

    const message = decodeURIComponent(href.split("?text=")[1] ?? "");
    expect(message).toContain("Juan Perez");
    expect(message).toContain("Blonde Ale");
  });

  it("shows a validation error and no WhatsApp link when required fields are missing", () => {
    renderCheckout();

    expect(screen.getByRole("alert")).toHaveTextContent("Indica tu nombre.");
    expect(screen.getByRole("button", { name: "Preparar WhatsApp" })).toBeDisabled();
  });

  it("applies a promo code despite incidental whitespace and different casing", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await fillRequiredFields(user);

    await user.type(screen.getByLabelText("Promoción"), "  primerabirra  ");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Promoción aplicada.")).toBeInTheDocument();
    expect(screen.getByText(/Promo PRIMERABIRRA/)).toBeInTheDocument();
    expect(screen.getByText(`-${formatPrice(testItemPrice * 0.1)}`)).toBeInTheDocument();
  });

  it("rejects a promotion that is outside its active date window even if the code matches", async () => {
    const user = userEvent.setup();
    const expired: Promotion = {
      id: "vieja",
      code: "VIEJA",
      type: "percentage",
      value: 0.2,
      active: true,
      endDate: "2020-01-01",
    };
    renderCheckout(snapshotWithPromotions([expired]));
    await fillRequiredFields(user);

    await user.type(screen.getByLabelText("Promoción"), "VIEJA");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Código no válido.")).toBeInTheDocument();
  });

  it("discounts the real peso amount for a fixed-type promotion instead of $0", async () => {
    const user = userEvent.setup();
    const fixed: Promotion = {
      id: "fijo",
      code: "FIJO1000",
      type: "fixed",
      value: 1000,
      active: true,
    };
    renderCheckout(snapshotWithPromotions([fixed]));
    await fillRequiredFields(user);

    await user.type(screen.getByLabelText("Promoción"), "fijo1000");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Promoción aplicada.")).toBeInTheDocument();
    expect(screen.getByText("-$1.000")).toBeInTheDocument();
  });

  it("caps a fixed-type discount at the subtotal so the total never goes negative", async () => {
    const user = userEvent.setup();
    const fixed: Promotion = {
      id: "fijo",
      code: "FIJOGRANDE",
      type: "fixed",
      value: 999999,
      active: true,
    };
    renderCheckout(snapshotWithPromotions([fixed]));
    await fillRequiredFields(user);

    await user.type(screen.getByLabelText("Promoción"), "FIJOGRANDE");
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    // El descuento no puede superar el subtotal del único ítem del carrito.
    expect(screen.getByText(`-${formatPrice(testItemPrice)}`)).toBeInTheDocument();
    const totalRow = screen.getByText("Total estimado").closest("div") as HTMLElement;
    expect(within(totalRow).getByText("$0")).toBeInTheDocument();
  });
});
