import { Check, MapPin, Store, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryOptionId } from "@/domain/commercialTypes";

export interface DeliveryOptionListItem {
  id: DeliveryOptionId;
  label: string;
  desc: string;
  requiresAddress: boolean;
}

interface DeliveryOptionPickerProps {
  deliveryOptions: DeliveryOptionListItem[];
  selectedDeliveryId: DeliveryOptionId | null;
  onSelect: (id: DeliveryOptionId) => void;
}

const ICON_BY_DELIVERY: Record<string, LucideIcon> = {
  fabrica: Store,
  norte: Truck,
  caba: MapPin,
};

export function DeliveryOptionPicker({
  deliveryOptions,
  selectedDeliveryId,
  onSelect,
}: DeliveryOptionPickerProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary" /> Entrega
      </h3>
      <div className="grid gap-3">
        {deliveryOptions.map((d) => {
          const Icon = ICON_BY_DELIVERY[d.id] ?? (d.requiresAddress ? Truck : Store);
          const selected = selectedDeliveryId === d.id;

          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={cn(
                "w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                selected
                  ? "bg-primary/10 border-primary"
                  : "bg-white/5 border-transparent hover:bg-white/10",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                  selected ? "bg-primary text-black" : "bg-white/10 text-white",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white leading-none mb-1">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
              </div>
              {selected && <Check className="w-5 h-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
