import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithCart } from "@/test/renderWithProviders";
import { ArmaTuPedido } from "./ArmaTuPedido";

const FUTURE_DATE = "2030-01-01";

function renderWizard() {
  return renderWithCart(
    <ArmaTuPedido
      pendingRecommendation={null}
      pendingBeverageMix={null}
      pendingBeerPreferenceIds={[]}
      sectionRef={{ current: null }}
    />,
  );
}

describe("ArmaTuPedido", () => {
  it("recorre el wizard completo y genera el link de WhatsApp con los datos cargados", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Paso 1: tipo de pedido.
    await user.click(screen.getByRole("button", { name: /Barril/ }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    // Paso 2: estilo de cerveza.
    await waitFor(() => screen.getByRole("button", { name: /Blonde Ale/ }));
    await user.click(screen.getByRole("button", { name: /Blonde Ale/ }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    // Paso 3: agregar una presentacion de barril al pedido.
    await waitFor(() => screen.getAllByRole("button", { name: "Agregar al pedido" }));
    await user.click(screen.getAllByRole("button", { name: "Agregar al pedido" })[0]);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    // Paso 4: datos del cliente (entrega queda en "fabrica", el default sin direccion requerida).
    await waitFor(() => screen.getByLabelText(/Nombre Completo/));
    await user.type(screen.getByLabelText(/Nombre Completo/), "Juan Perez");
    const dateInput = document.getElementById("order-date") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: FUTURE_DATE } });
    await user.click(screen.getByRole("button", { name: "Ver resumen" }));

    // Paso 5: el link de checkout ya tiene el href armado, sin necesidad de clickearlo.
    const whatsAppLink = await waitFor(() =>
      screen.getByRole("link", { name: "Confirmar por WhatsApp" }),
    );
    const href = whatsAppLink.getAttribute("href") ?? "";
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);

    const decodedMessage = decodeURIComponent(href.split("?text=")[1]);
    expect(decodedMessage).toContain("Juan Perez");
    expect(decodedMessage).toContain("Blonde Ale");
  });
});
