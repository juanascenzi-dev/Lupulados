import { motion } from "framer-motion";
import { getWizardPhase, PHASE_LABELS, type Step } from "@/domain/orderWizardConstants";
import { BeerGlass } from "@/components/order-wizard/BeerGlass";

interface BeerGlassStepperProps {
  step: Step;
}

export function BeerGlassStepper({ step }: BeerGlassStepperProps) {
  const phase = getWizardPhase(step);
  const progress = ((phase - 1) / 2) * 100;
  return (
    <div className="w-full">
      <div className="hidden md:flex justify-between items-end relative mx-auto max-w-md lg:max-w-sm xl:max-w-md">
        <div className="absolute left-4 right-4 h-0.5 bg-white/10 bottom-7 z-0" />
        <motion.div
          className="absolute left-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 bottom-7 z-0"
          initial={{ width: 0 }}
          animate={{ width: `calc(${progress}% - 0px)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {([1, 2, 3] as const).map((i) => (
          <div key={i} className="relative z-10">
            <BeerGlass
              state={phase > i ? "done" : phase === i ? "active" : "future"}
              label={PHASE_LABELS[i - 1]}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{["🛢️", "🍺", "📏", "✨", "🎟️"][step - 1]}</span>
          <div>
            <p className="text-white font-bold text-sm">
              Paso {phase} de 3 — {PHASE_LABELS[phase - 1]}
            </p>
          </div>
        </div>
        <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
