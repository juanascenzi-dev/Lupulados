import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithCommercialData } from "@/test/renderWithProviders";
import { Calculadora } from "./Calculadora";

describe("Calculadora", () => {
  it("muestra una recomendacion calculada apenas se monta, con los valores por defecto", () => {
    renderWithCommercialData(<Calculadora onUseRecommendation={vi.fn()} />);

    const resultPanel = screen.getByRole("status");
    expect(resultPanel).toHaveTextContent("Vas a necesitar");
    expect(resultPanel).not.toHaveTextContent("Falta un dato");
  });

  it("recalcula el resultado en vivo cuando cambian los invitados o el tipo de evento", async () => {
    const user = userEvent.setup();
    renderWithCommercialData(<Calculadora onUseRecommendation={vi.fn()} />);

    const resultPanel = screen.getByRole("status");
    const before = resultPanel.textContent;

    // El layout viewport-first monta el grid desktop y el flujo mobile a la vez
    // (solo ocultos por CSS) - ambas copias comparten el mismo estado, alcanza
    // con interactuar con la primera.
    const increaseGuests = screen.getAllByRole("button", { name: "Sumar 5 invitados" })[0];
    await user.click(increaseGuests);
    await user.click(increaseGuests);

    expect(resultPanel.textContent).not.toBe(before);

    const intensaButton = screen.getAllByRole("button", { name: /Fiesta Intensa/ })[0];
    await user.click(intensaButton);

    expect(intensaButton).toHaveAttribute("aria-pressed", "true");
  }, 15000); // el layout viewport-first monta desktop y mobile a la vez; bajo instrumentación de coverage supera el timeout default (ver CHANGELOG, mismo caso que ArmaTuPedido.test.tsx)

  it("llama a onUseRecommendation con la recomendacion, la mezcla y las preferencias de estilo", async () => {
    const user = userEvent.setup();
    const onUseRecommendation = vi.fn();
    renderWithCommercialData(<Calculadora onUseRecommendation={onUseRecommendation} />);

    await user.click(screen.getByRole("button", { name: "Usar esta recomendacion" }));

    expect(onUseRecommendation).toHaveBeenCalledTimes(1);
    const [recommendation, mixResult, beerPreferenceIds] = onUseRecommendation.mock.calls[0];

    expect(typeof recommendation.label).toBe("string");
    expect(recommendation.label.length).toBeGreaterThan(0);
    expect(recommendation.parts.length).toBeGreaterThan(0);
    expect(typeof recommendation.estimatedPrice).toBe("number");
    expect(Array.isArray(mixResult)).toBe(true);
    expect(beerPreferenceIds).toEqual([]);
  });
});
