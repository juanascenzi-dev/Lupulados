import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeerGlassProps {
  state: "done" | "active" | "future";
  label: string;
}

export function BeerGlass({ state, label }: BeerGlassProps) {
  const hasBeer = state !== "future";
  const fillH = state === "done" ? "88%" : state === "active" ? "58%" : "0%";
  const borderColor = hasBeer ? "border-amber-500" : "border-white/15";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "relative w-8 h-12 border-2 rounded-b-md overflow-hidden bg-transparent transition-colors duration-500",
          borderColor,
        )}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-amber-500"
          initial={{ height: 0 }}
          animate={{ height: fillH }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {hasBeer && (
          <motion.div
            className="absolute left-0 right-0 h-2.5 bg-white/90"
            style={{ borderRadius: "50% 50% 0 0 / 80% 80% 0 0" }}
            initial={{ opacity: 0, bottom: "0%" }}
            animate={{ opacity: 1, bottom: state === "done" ? "84%" : "53%" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        )}
        {state === "done" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
        {state === "active" && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span
        className={cn(
          "hidden md:block text-[9px] font-bold uppercase tracking-widest w-max text-center",
          hasBeer ? "text-amber-400" : "text-white/25",
        )}
      >
        {label}
      </span>
    </div>
  );
}
