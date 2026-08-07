import { AnimatePresence, motion } from "framer-motion";
import { Beer, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { getCartItemImage } from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import { getCartLineTitle, getCompactCartLineDescription } from "@/domain/cartLineFormatting";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export function LiveOrderSummary({
  onClose,
  asDrawer = false,
  detailed = false,
}: {
  onClose?: () => void;
  asDrawer?: boolean;
  detailed?: boolean;
}) {
  const { items, removeItem, updateQty, totalPrice, totalItems, extras, orderSummary, clearCart } =
    useCart();
  const { snapshot, deliveryOptions, priceDisclaimer } = useCommercialDerivedData();
  const deliveryCost = deliveryOptions.find((option) => option.id === extras.delivery)?.cost ?? 0;
  const totalLiters = orderSummary.totalLiters;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", asDrawer ? "max-h-[65dvh]" : "")}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-white text-lg">Tu pedido</h3>
          {totalItems > 0 && (
            <span className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        {asDrawer && onClose && (
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="p-1 text-white/50 hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overscroll-contain pr-1",
          asDrawer ? "overflow-y-auto" : "overflow-visible",
          items.length > 0 ? "space-y-2" : "",
        )}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-5xl mb-4">🍺</span>
            <p className="text-white/60 text-sm font-medium">Tu carrito está vacío</p>
            <p className="text-white/30 text-xs mt-1">¡Empezá a elegir tus cervezas!</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => {
              const beerImg =
                snapshot.products.find((product) => product.id === item.productId)?.image ||
                getCartItemImage(item.name);
              const lineTitle = getCartLineTitle(item);
              const lineDescription = getCompactCartLineDescription(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5"
                >
                  {beerImg ? (
                    <img
                      src={beerImg}
                      alt={item.name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20">
                      <Beer className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-bold leading-tight text-white">
                      {lineTitle}
                    </p>
                    {lineDescription && (
                      <p className="truncate text-xs text-white/50">{lineDescription}</p>
                    )}
                    {detailed && item.pack?.type === "configurable-beer-pack" && (
                      <div className="mt-2 space-y-0.5 rounded-lg border border-white/10 bg-black/20 p-2 text-[11px] text-white/60">
                        {item.pack.composition.map((selection) => (
                          <p key={selection.productId}>
                            {selection.quantity} {selection.name ?? "Estilo"}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-1">
                      <QuantityStepper
                        size="cart"
                        value={item.qty}
                        onChange={(next) => updateQty(item.id, next)}
                        decreaseAriaLabel={`Restar una unidad de ${item.name}`}
                        increaseAriaLabel={`Sumar una unidad de ${item.name}`}
                        valueAriaLabel={`Cantidad de ${item.name}`}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-right text-xs font-bold text-white">
                      {formatPrice(item.price * item.qty)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Eliminar ${item.name} del carrito`}
                      onClick={() => removeItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-3 shrink-0 space-y-2 border-t border-white/10 pt-3">
          {totalLiters > 0 && (
            <p className="text-xs text-amber-400 font-bold">🍺 {totalLiters}L en barriles</p>
          )}
          {deliveryCost > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery</span>
              <span>{formatPrice(deliveryCost)}</span>
            </div>
          )}
          {extras.discount > 0 && (
            <div className="flex justify-between text-xs text-green-400 font-bold">
              <span>Descuento ({extras.promoCode})</span>
              <span>-10%</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white">
            <span>Total estimado</span>
            <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
          </div>
          <p className="text-[11px] text-white/35 leading-snug">{priceDisclaimer}</p>
          <button
            type="button"
            onClick={clearCart}
            className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs text-white/45 transition-all hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Vaciar pedido
          </button>
        </div>
      )}
    </div>
  );
}
