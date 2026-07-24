import React, { createContext, useContext, useState, useEffect } from "react";
import { additionalCosts, getDeliveryOption, type DeliveryOptionId } from "@/domain/businessConfig";
import { readCartItems, writeCartItems, type StoredCartItem } from "@/domain/cartStorage";
import type { CartCategory } from "@/domain/beerCatalog";

export type CartItem = StoredCartItem;

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty"> & { category: CartCategory }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  extras: {
    chopera: boolean;
    delivery: DeliveryOptionId;
    hielo: number;
    vasos: number;
    promoCode: string;
    discount: number;
  };
  setExtras: React.Dispatch<React.SetStateAction<CartContextType["extras"]>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return readCartItems(window.localStorage);
  });

  const [extras, setExtras] = useState<CartContextType["extras"]>({
    chopera: false,
    delivery: "fabrica",
    hielo: 0,
    vasos: 0,
    promoCode: "",
    discount: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      writeCartItems(window.localStorage, items);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "qty"> & { category: CartCategory }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...newItem, qty: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setExtras({ chopera: false, delivery: "fabrica", hielo: 0, vasos: 0, promoCode: "", discount: 0 });
  };

  const totalItems = items.reduce((acc, item) => acc + item.qty, 0);

  // Consider free chopera if 50L barrel exists
  const has50L = items.some(i => i.id.includes("barril50L"));
  const choperaCost = extras.chopera && !has50L ? additionalCosts.chopera : 0;
  
  const deliveryCost = getDeliveryOption(extras.delivery).cost;
    
  const hieloCost = extras.hielo * additionalCosts.hielo;
  
  // Free glasses once the configured purchase threshold is reached.
  const baseItemsPrice = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vasosCost = baseItemsPrice > additionalCosts.freeGlassesThreshold ? 0 : extras.vasos * additionalCosts.vasos;

  const subtotal = baseItemsPrice + choperaCost + deliveryCost + hieloCost + vasosCost;
  const discountAmount = subtotal * extras.discount;
  const totalPrice = subtotal - discountAmount;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
        extras,
        setExtras,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
