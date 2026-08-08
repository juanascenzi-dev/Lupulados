import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithCart } from "@/test/renderWithProviders";
import { commercialSnapshot } from "@/domain/commercialData";
import type { CommercialSnapshot } from "@/domain/commercialTypes";
import { ArmaTuPedido } from "./ArmaTuPedido";

const FUTURE_DATE = "2030-01-01";

function renderWizard(options: { snapshot?: CommercialSnapshot } = {}) {
  return renderWithCart(
    <ArmaTuPedido
      pendingRecommendation={null}
      pendingBeverageMix={null}
      pendingBeerPreferenceIds={[]}
      sectionRef={{ current: null }}
    />,
    options,
  );
}

// Snapshot con todos los canales de WhatsApp mal configurados (telefono invalido), para
// ejercitar el camino donde buildWhatsAppOrderUrl tira y el wizard debe avisarlo en vez
// de dejar el boton de confirmar inerte sin explicacion.
function brokenWhatsAppSnapshot(): CommercialSnapshot {
  return {
    ...structuredClone(commercialSnapshot),
    whatsappChannels: commercialSnapshot.whatsappChannels.map((channel) => ({
      ...channel,
      phoneE164: "123",
    })),
  };
}

/** Recorre los pasos 1-4 (Barril, Blonde Ale, agregar al pedido, datos del cliente) hasta el ticket. */
async function goToTicketStep(user: ReturnType<typeof userEvent.setup>) {
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
}

describe("ArmaTuPedido", () => {
  it("recorre el wizard completo y genera el link de WhatsApp con los datos cargados", async () => {
    const user = userEvent.setup();
    renderWizard();

    await goToTicketStep(user);

    // Paso 5: el link de checkout ya tiene el href armado, sin necesidad de clickearlo.
    const whatsAppLink = await waitFor(() =>
      screen.getByRole("link", { name: "Confirmar por WhatsApp" }),
    );
    const href = whatsAppLink.getAttribute("href") ?? "";
    expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);

    const decodedMessage = decodeURIComponent(href.split("?text=")[1]);
    expect(decodedMessage).toContain("Juan Perez");
    expect(decodedMessage).toContain("Blonde Ale");
  }, 15000);

  it("anuncia el cambio de paso a lectores de pantalla", async () => {
    const user = userEvent.setup();
    renderWizard();

    expect(screen.getByText("Paso 1 de 5 — Productos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Barril/ }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => expect(screen.getByText("Paso 2 de 5 — Productos")).toBeInTheDocument());
  });

  it("muestra un aviso si no se puede generar el link de WhatsApp en vez de dejar el boton inerte", async () => {
    const user = userEvent.setup();
    renderWizard({ snapshot: brokenWhatsAppSnapshot() });

    await goToTicketStep(user);

    await waitFor(() =>
      expect(screen.getByText(/No pudimos generar el link de WhatsApp/)).toBeInTheDocument(),
    );
    expect(screen.getByText("Confirmar por WhatsApp")).toHaveAttribute("aria-disabled", "true");
  }, 15000);
});
