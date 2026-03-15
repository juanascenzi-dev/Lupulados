import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // e.g. "IPA-barril30L"
  name: string; // e.g. "IPA - Barril 30L"
  price: number;
  qty: number;
  category: "barril" | "growler" | "porrón" | "pack";
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  extras: {
    chopera: boolean;
    delivery: "norte" | "caba" | "fabrica";
    hielo: number;
    vasos: number;
  };
  setExtras: React.Dispatch<React.SetStateAction<CartContextType["extras"]>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("lupulados-cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [extras, setExtras] = useState<CartContextType["extras"]>({
    chopera: false,
    delivery: "fabrica",
    hielo: 0,
    vasos: 0,
  });

  useEffect(() => {
    localStorage.setItem("lupulados-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "qty">) => {
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
    setExtras({ chopera: false, delivery: "fabrica", hielo: 0, vasos: 0 });
  };

  const totalItems = items.reduce((acc, item) => acc + item.qty, 0);

  // Consider free chopera if 50L barrel exists
  const has50L = items.some(i => i.id.includes("barril50L"));
  const choperaCost = extras.chopera && !has50L ? 15000 : 0;
  
  const deliveryCost = 
    extras.delivery === "norte" ? 8000 : 
    extras.delivery === "caba" ? 12000 : 0;
    
  const hieloCost = extras.hielo * 3000;
  
  // Free glasses if items base cost > 80000
  const baseItemsPrice = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vasosCost = baseItemsPrice > 80000 ? 0 : extras.vasos * 800;

  const totalPrice = baseItemsPrice + choperaCost + deliveryCost + hieloCost + vasosCost;

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
