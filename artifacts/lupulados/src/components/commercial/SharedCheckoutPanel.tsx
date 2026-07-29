import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { MessageCircle, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "@/domain/whatsAppOrder";
import {
  getDefaultWhatsAppChannelId,
  getTodayInputValue,
  listOrderWhatsAppChannels,
  validateCheckout,
  type CheckoutFormData,
} from "@/domain/checkout";
import { WhatsAppChannelSelector } from "./WhatsAppChannelSelector";

const WHATSAPP_ACTIVATION_GUARD_MS = 1500;

export function SharedCheckoutPanel({
  compact = false,
  demoNotice = false,
}: {
  compact?: boolean;
  demoNotice?: boolean;
}) {
  const { snapshot } = useCommercialData();
  const { items, updateQty, removeItem, clearCart, orderSummary, extras, setExtras, totalItems } = useCart();
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    eventDate: "",
    timeSlot: "Mañana 9-12hs",
    delivery: extras.delivery,
    address: "",
    notes: "",
  });
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<"none" | "valid" | "invalid">("none");
  const channels = useMemo(() => listOrderWhatsAppChannels(snapshot.whatsappChannels), [snapshot.whatsappChannels]);
  const [selectedChannelId, setSelectedChannelId] = useState(() => getDefaultWhatsAppChannelId(snapshot.whatsappChannels));
  const whatsAppLastActivationRef = useRef(0);
  const unlockTimerRef = useRef<number | null>(null);
  const [opening, setOpening] = useState(false);

  const today = getTodayInputValue();
  const deliveryOptions = snapshot.deliveryOptions.filter((option) => option.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedDelivery = deliveryOptions.find((option) => option.id === extras.delivery) ?? deliveryOptions[0];
  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  const promotion = snapshot.promotions.find((item) => item.active);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, delivery: extras.delivery }));
  }, [extras.delivery]);

  useEffect(() => {
    if (selectedChannelId && channels.some((channel) => channel.id === selectedChannelId)) return;
    setSelectedChannelId(channels[0]?.id ?? "");
  }, [channels, selectedChannelId]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const validation = validateCheckout({
    formData,
    totalItems,
    today,
    deliveryRequiresAddress: selectedDelivery?.requiresAddress ?? false,
  });

  const applyPromo = () => {
    const activePromotion = promotion;
    const code = activePromotion?.code ?? "";
    if (activePromotion && code && promoInput.trim().toUpperCase() === code) {
      setExtras((prev) => ({ ...prev, promoCode: code, discount: activePromotion.type === "percentage" ? activePromotion.value : 0 }));
      setPromoStatus("valid");
      return;
    }
    setExtras((prev) => ({ ...prev, promoCode: "", discount: 0 }));
    setPromoStatus("invalid");
  };

  const message = buildWhatsAppOrderMessage({
    customer: {
      name: formData.name,
      eventDate: formData.eventDate,
      timeSlot: formData.timeSlot,
      address: formData.address,
      notes: formData.notes,
    },
    summary: orderSummary,
    snapshot,
  });

  let whatsAppUrl: string | null = null;
  try {
    whatsAppUrl = selectedChannel && validation.valid ? buildWhatsAppOrderUrl(selectedChannel.phoneE164, message) : null;
  } catch {
    whatsAppUrl = null;
  }

  const handleWhatsAppClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    if (now - whatsAppLastActivationRef.current < WHATSAPP_ACTIVATION_GUARD_MS) {
      event.preventDefault();
      return;
    }

    whatsAppLastActivationRef.current = now;
    setOpening(true);
    if (unlockTimerRef.current !== null) window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => {
      setOpening(false);
      unlockTimerRef.current = null;
    }, WHATSAPP_ACTIVATION_GUARD_MS);
  };

  const handleWhatsAppKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  };

  return (
    <div className={cn("grid gap-5", compact ? "" : "lg:grid-cols-[minmax(0,1fr)_360px]")}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-white">Carrito</h2>
            {items.length > 0 && (
              <button type="button" onClick={clearCart} className="text-xs font-bold text-white/45 hover:text-red-300 flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Vaciar
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55" role="status">
              Todavía no agregaste productos.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white leading-tight">{item.productName ?? item.name}</h3>
                      <p className="text-xs text-white/45">{item.presentationLabel ?? item.category}</p>
                      {item.promotional && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                          {item.promotionLabel ?? "Precio promocional demo"}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-mono text-sm font-bold text-primary">{formatPrice(item.price * item.qty)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-xl bg-white/10 p-1">
                      <button type="button" aria-label={`Restar ${item.name}`} onClick={() => updateQty(item.id, item.qty - 1)} className="h-9 w-9 rounded-lg hover:bg-white/10 flex items-center justify-center">
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <input
                        aria-label={`Cantidad de ${item.name}`}
                        type="number"
                        min={1}
                        max={999}
                        value={item.qty}
                        onChange={(event) => updateQty(item.id, Number(event.target.value))}
                        className="h-9 w-12 rounded-lg bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button type="button" aria-label={`Sumar ${item.name}`} onClick={() => updateQty(item.id, item.qty + 1)} className="h-9 w-9 rounded-lg hover:bg-white/10 flex items-center justify-center">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs font-bold text-white/45 hover:text-red-300">
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-lg font-bold text-white mb-4">Datos y entrega</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Nombre *</span>
              <input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} autoComplete="name" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-primary focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Fecha *</span>
              <input type="date" min={today} value={formData.eventDate} onChange={(event) => setFormData((prev) => ({ ...prev, eventDate: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white [color-scheme:dark] focus:border-primary focus:outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Horario</span>
              <Select value={formData.timeSlot} onValueChange={(value) => setFormData((prev) => ({ ...prev, timeSlot: value }))}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
                  <SelectItem value="Mañana 9-12hs" className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white">Mañana (9-12hs)</SelectItem>
                  <SelectItem value="Tarde 12-16hs" className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white">Tarde (12-16hs)</SelectItem>
                  <SelectItem value="Noche 16-20hs" className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white">Noche (16-20hs)</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Entrega o retiro</span>
              <Select
                value={extras.delivery}
                onValueChange={(value) => setExtras((prev) => ({ ...prev, delivery: value }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
                  {deliveryOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white">{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          {selectedDelivery?.requiresAddress && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Dirección *</span>
              <input value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} autoComplete="street-address" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-primary focus:outline-none" />
            </label>
          )}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Comentarios</span>
            <textarea value={formData.notes} onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))} className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-primary focus:outline-none" />
          </label>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <h2 className="text-lg font-bold text-white mb-3">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-white/55">Productos</span><span className="font-mono text-white">{formatPrice(orderSummary.itemsSubtotal)}</span></div>
            {orderSummary.extrasTotal > 0 && <div className="flex justify-between gap-3"><span className="text-white/55">Extras</span><span className="font-mono text-white">{formatPrice(orderSummary.extrasTotal)}</span></div>}
            <div className="flex justify-between gap-3"><span className="text-white/55">Envio</span><span className="font-mono text-white">{formatPrice(orderSummary.deliveryCost)}</span></div>
            {orderSummary.discountAmount > 0 && <div className="flex justify-between gap-3 text-green-300"><span>Promo {orderSummary.discountCode}</span><span className="font-mono">-{formatPrice(orderSummary.discountAmount)}</span></div>}
            <div className="border-t border-white/10 pt-3 flex justify-between gap-3 text-lg font-black"><span className="text-white">Total estimado</span><span className="font-mono text-primary">{formatPrice(orderSummary.total)}</span></div>
          </div>
          {demoNotice && (
            <p className="mt-3 rounded-xl border border-amber-400/20 bg-black/20 p-3 text-xs leading-relaxed text-amber-100">
              Catálogo de demostración. Productos, precios y disponibilidad son ilustrativos y se confirman por WhatsApp.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
          <div>
            <label htmlFor="shared-promo-code" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/65">Promoción</label>
            <div className="flex gap-2">
              <input id="shared-promo-code" value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder={promotion?.code ? `Ej: ${promotion.code}` : "Codigo"} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              <button type="button" onClick={applyPromo} className="rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">Aplicar</button>
            </div>
            {promoStatus === "valid" && <p className="mt-2 text-xs font-bold text-green-300" role="status">Promoción aplicada.</p>}
            {promoStatus === "invalid" && <p className="mt-2 text-xs font-bold text-red-300" role="alert">Código no válido.</p>}
          </div>
          <WhatsAppChannelSelector channels={channels} selectedChannelId={selectedChannel?.id ?? ""} onSelect={setSelectedChannelId} />
          {!validation.valid && (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100" role="alert">
              {validation.errors[0]}
            </div>
          )}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              onKeyDown={handleWhatsAppKeyDown}
              className={cn("flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-center font-bold text-white transition-colors hover:bg-[#1db954]", opening ? "opacity-70" : "")}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {opening ? "Abriendo WhatsApp..." : "Preparar WhatsApp"}
            </a>
          ) : (
            <button type="button" disabled className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3.5 text-center font-bold text-white/35">
              Preparar WhatsApp
            </button>
          )}
        </section>
      </aside>
    </div>
  );
}
