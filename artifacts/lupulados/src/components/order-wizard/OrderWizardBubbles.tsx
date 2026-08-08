import { memo, useState } from "react";
import { motion } from "framer-motion";
import { BUBBLES } from "@/domain/orderWizardConstants";

/**
 * Capa decorativa de burbujas de fondo de "Armá tu pedido". Aislada en su propio
 * componente memoizado (sin props) para que no vuelva a renderizar cada vez que
 * `ArmaTuPedido` re-renderiza por cambios de estado ajenos (ej. cada tecla tipeada
 * en el formulario del paso 4) — es puramente cosmética y no depende de nada de eso.
 */
function OrderWizardBubblesComponent() {
  const [travelDistance] = useState(() => window.innerHeight * 1.2);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {BUBBLES.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: "-5%",
            background: "radial-gradient(circle, rgba(245,158,11,0.25), transparent)",
          }}
          animate={{
            y: [0, -travelDistance],
            opacity: [0, 0.15, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export const OrderWizardBubbles = memo(OrderWizardBubblesComponent);
