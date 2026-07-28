import React, { createContext, useContext, useState, useEffect } from "react";
import {
  addCartItemToCart,
  normalizeCartQuantity,
  readCartItems,
  reconcileCartItemsWithSnapshot,
  updateCartItemQuantity,
  writeCartItems,
  type StoredCartItem,
} from "@/domain/cartStorage";
import { calculateOrderSummary, type OrderSummary } from "@/domain/orderSummary";
import { useCommercialData } from "@/context/CommercialDataContext";
import type { DeliveryOptionId } from "@/domain/commercialTypes";

export type CartItem = StoredCartItem;

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  orderSummary: OrderSummary;
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
  const { snapshot } = useCommercialData();
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

  useEffect(() => {
    setItems((prev) => {
      const next = reconcileCartItemsWithSnapshot(prev, snapshot);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [snapshot]);

  const addItem = (newItem: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => addCartItemToCart(prev, newItem, qty));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    const nextQty = normalizeCartQuantity(qty);
    if (nextQty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => updateCartItemQuantity(prev, id, nextQty));
  };

  const clearCart = () => {
    setItems([]);
    setExtras({ chopera: false, delivery: "fabrica", hielo: 0, vasos: 0, promoCode: "", discount: 0 });
  };

  const orderSummary = calculateOrderSummary(items, extras, snapshot);
  const totalItems = orderSummary.totalItems;
  const totalPrice = orderSummary.total;

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
        orderSummary,
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
