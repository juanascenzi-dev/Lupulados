import { WhatsAppChannelSelector } from "@/components/commercial/WhatsAppChannelSelector";
import type { OrderFormData } from "@/components/order-wizard/CustomerDetailsForm";
import type { StoredCartItem } from "@/domain/cartStorage";
import type { WhatsAppChannel } from "@/domain/commercialTypes";
import { formatPrice } from "@/domain/format";
import type { OrderSummary } from "@/domain/orderSummary";

const TICKET_EDGE_POLYGONS = Array.from({ length: 30 }).map((_, i) => (
  <polygon key={i} points={`${i * 40},0 ${i * 40 + 20},20 ${i * 40 + 40},0`} fill="#0a0a0a" />
));

interface OrderTicketProps {
  orderId: number;
  formData: OrderFormData;
  orderSummary: OrderSummary;
  items: StoredCartItem[];
  totalPrice: number;
  priceDisclaimer: string;
  whatsAppChannels: WhatsAppChannel[];
  /** Resolved selected channel id, already defaulted (e.g. `selectedWhatsAppChannel?.id ?? ""`). */
  selectedChannelId: string;
  onSelectWhatsAppChannel: (channelId: string) => void;
}

export function OrderTicket({
  orderId,
  formData,
  orderSummary,
  items,
  totalPrice,
  priceDisclaimer,
  whatsAppChannels,
  selectedChannelId,
  onSelectWhatsAppChannel,
}: OrderTicketProps) {
  return (
    <>
      <div className="relative bg-[#fafaf8] text-[#222] rounded-lg shadow-2xl overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full overflow-hidden leading-none"
          style={{ height: "16px" }}
        >
          <svg viewBox="0 0 1200 20" className="w-full h-full" preserveAspectRatio="none">
            {TICKET_EDGE_POLYGONS}
          </svg>
        </div>
        <div
          className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180"
          style={{ height: "16px" }}
        >
          <svg viewBox="0 0 1200 20" className="w-full h-full" preserveAspectRatio="none">
            {TICKET_EDGE_POLYGONS}
          </svg>
        </div>

        <div className="pt-8 pb-8 px-7">
          <div className="text-center mb-5">
            <p className="text-3xl mb-1">🍺</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter">LUPULADOS</h3>
            <p className="text-[10px] font-mono text-[#999] mt-0.5">
              CERVECERÍA ARTESANAL · ENTREGA A COORDINAR
            </p>
            <div className="mt-4 py-2 border-y-2 border-dashed border-[#ccc]">
              <p className="font-mono font-bold text-sm tracking-widest">ORDEN #{orderId}</p>
            </div>
          </div>

          <div className="space-y-2 font-mono text-sm">
            {[
              { label: "CLIENTE", value: formData.nombre || "—" },
              { label: "FECHA", value: formData.fecha || "—" },
              { label: "HORARIO", value: formData.horario },
              {
                label: "ENVÍO",
                value: orderSummary.delivery.label,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-end gap-1">
                <span className="text-[#777] text-[11px] shrink-0">{row.label}</span>
                <div className="flex-1 border-b border-dotted border-[#ccc] mb-0.5 mx-1" />
                <span className="text-[11px] shrink-0 text-right max-w-[120px] truncate">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#ddd]">
            <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#999] mb-3">
              Detalle del pedido
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start font-mono text-xs gap-2"
                >
                  <div className="flex-1">
                    <p className="font-bold text-[#333] leading-tight">{item.name}</p>
                    <p className="text-[10px] text-[#999]">
                      {item.qty} u. × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="font-bold text-[#222] shrink-0">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {orderSummary.extraLines.length > 0 && (
            <div className="mt-3 space-y-1 font-mono text-xs">
              {orderSummary.extraLines.map((extra) => (
                <div key={extra.id} className="flex justify-between text-[#555]">
                  <span>{extra.label.toUpperCase()}</span>
                  <span>{formatPrice(extra.total)}</span>
                </div>
              ))}
            </div>
          )}

          {orderSummary.deliveryCost > 0 && (
            <div className="mt-3 flex justify-between font-mono text-xs text-[#555]">
              <span>ENVIO</span>
              <span>{formatPrice(orderSummary.deliveryCost)}</span>
            </div>
          )}

          {orderSummary.discountAmount > 0 && (
            <div className="mt-3 flex justify-between font-mono text-xs text-green-600 font-bold">
              <span>DESCUENTO {orderSummary.discountCode}</span>
              <span>-{formatPrice(orderSummary.discountAmount)}</span>
            </div>
          )}
          <div className="mt-4 pt-4 border-t-2 border-dashed border-[#ccc] text-center">
            <p className="text-[10px] font-mono text-[#999] uppercase tracking-widest mb-1">
              Total estimado
            </p>
            <p className="text-4xl font-black tracking-tight text-[#111]">
              {formatPrice(totalPrice)}
            </p>
            <p className="text-[9px] font-mono text-[#777] mt-2 leading-snug">{priceDisclaimer}</p>
          </div>

          <p className="text-center text-[9px] font-mono text-[#bbb] mt-5 leading-relaxed">
            NO ES COMPROBANTE FISCAL
            <br />
            GRACIAS POR ELEGIRNOS 🍻 LUPULADOS.AR
          </p>
        </div>
      </div>

      <div className="mt-6">
        <WhatsAppChannelSelector
          channels={whatsAppChannels}
          selectedChannelId={selectedChannelId}
          onSelect={onSelectWhatsAppChannel}
        />
      </div>
    </>
  );
}
