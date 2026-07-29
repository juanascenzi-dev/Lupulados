import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhatsAppChannel } from "@/domain/commercialTypes";

export function WhatsAppChannelSelector({
  channels,
  selectedChannelId,
  onSelect,
}: {
  channels: WhatsAppChannel[];
  selectedChannelId: string;
  onSelect: (channelId: string) => void;
}) {
  if (channels.length <= 1) return null;

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-bold uppercase tracking-widest text-white/65">Canal de WhatsApp</legend>
      <div className="grid gap-2">
        {channels.map((channel) => {
          const selected = selectedChannelId === channel.id;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel.id)}
              aria-pressed={selected}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-primary/60",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-bold text-white">{channel.label}</span>
                  <span className="block text-xs text-white/50">
                    {channel.phoneDisplay}
                    {channel.isPrimary ? " · recomendado" : ""}
                  </span>
                </span>
                {selected && <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
