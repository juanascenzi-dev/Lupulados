import { useState } from "react";
import { cn } from "@/lib/utils";

interface OrderTypeVisualProps {
  option: { img: string; title: string; emoji: string };
  selected: boolean;
}

export function OrderTypeVisual({ option, selected }: OrderTypeVisualProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-28 md:h-32 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.22),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
      {!failed && option.img ? (
        <img
          src={option.img}
          alt={`Imagen de ${option.title}`}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            selected ? "brightness-75" : "brightness-50 group-hover:brightness-[0.65]",
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
          {option.emoji}
        </div>
      )}
      <div className={cn("absolute inset-0", selected ? "bg-amber-500/10" : "bg-black/20")} />
    </div>
  );
}
