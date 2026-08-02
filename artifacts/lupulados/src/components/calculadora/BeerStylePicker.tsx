import { useMemo, useState } from "react";
import { Beer, Search } from "lucide-react";
import type { Beer as BeerType } from "@/domain/beerCatalog";
import {
  normalizeBeerStyleSelection,
  summarizeBeerStyleSelection,
  toggleBeerStyleSelection,
} from "@/domain/beerStylePreference";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BeerStylePickerProps {
  beerCatalog: BeerType[];
  selectedBeerIds: string[];
  onChange: (beerIds: string[]) => void;
}

export function BeerStylePicker({ beerCatalog, selectedBeerIds, onChange }: BeerStylePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const normalizedIds = useMemo(
    () => normalizeBeerStyleSelection(selectedBeerIds, beerCatalog),
    [beerCatalog, selectedBeerIds],
  );
  const selectedPreview = normalizedIds
    .map((id) => beerCatalog.find((beer) => beer.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const selectedSummary =
    selectedPreview.length === 0
      ? summarizeBeerStyleSelection(normalizedIds, beerCatalog)
      : `${selectedPreview.slice(0, 2).join(", ")}${
          selectedPreview.length > 2 ? ` +${selectedPreview.length - 2}` : ""
        }`;
  const filteredCatalog = beerCatalog.filter((beer) =>
    beer.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openModal = () => {
    setDraftIds(normalizedIds);
    setQuery("");
    setOpen(true);
  };

  const applySelection = () => {
    onChange(normalizeBeerStyleSelection(draftIds, beerCatalog));
    setOpen(false);
  };

  return (
    <div className="calculator-card calculator-preference-card grid h-full gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="min-w-0">
        <span className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold uppercase tracking-wider text-white">
          <Beer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Preferencias
        </span>
        <p className="mt-1 truncate text-xs text-muted-foreground">{selectedSummary}</p>
      </div>
      <button
        type="button"
        onClick={openModal}
        className="w-full shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-colors hover:border-primary"
      >
        Elegir estilos
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(720px,calc(100dvh-2rem))] max-w-2xl overflow-hidden border-white/10 bg-[#15110d] text-white">
          <DialogHeader>
            <DialogTitle>Elegir estilos de cerveza</DialogTitle>
            <DialogDescription>
              Guardamos esto como preferencia para el pedido. No cambia los litros estimados.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-3">
            <button
              type="button"
              onClick={() => setDraftIds([])}
              aria-pressed={draftIds.length === 0}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left font-bold transition-colors",
                draftIds.length === 0
                  ? "border-primary bg-primary text-black"
                  : "border-white/10 bg-white/5 text-white hover:border-white/30",
              )}
            >
              Cualquiera / sin preferencia
            </button>

            <label className="relative block">
              <span className="sr-only">Buscar estilos</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar estilo"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-3 text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
              />
            </label>

            <div className="max-h-[45dvh] space-y-2 overflow-y-auto pr-1">
              {filteredCatalog.map((beer) => {
                const selected = draftIds.includes(beer.id);
                return (
                  <button
                    key={beer.id}
                    type="button"
                    onClick={() =>
                      setDraftIds((current) =>
                        toggleBeerStyleSelection(current, beer.id, beerCatalog),
                      )
                    }
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/15"
                        : "border-white/10 bg-white/5 hover:border-white/30",
                    )}
                  >
                    <span>
                      <span className="block font-bold text-white">{beer.name}</span>
                      <span className="line-clamp-1 text-xs text-white/50">{beer.desc}</span>
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {selected ? "Seleccionado" : "Elegir"}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-white/45" aria-live="polite">
              {draftIds.length === 0
                ? "Sin preferencia activa."
                : `${draftIds.length} estilos seleccionados.`}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={() => setDraftIds([])}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={applySelection}
              className="min-h-11 rounded-xl bg-primary px-5 font-bold text-black"
            >
              Aplicar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
