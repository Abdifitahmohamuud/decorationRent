"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export interface CartItem {
  decorationId: string;
  name: string;
  price: number;
  quantity: number;
  availableQty: number;
  image?: string | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (decorationId: string, quantity: number) => void;
  removeFromCart: (decorationId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from locale storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("decor_cart");
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("decor_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    const existing = cartItems.find((i) => i.decorationId === item.decorationId);
    if (existing) {
      if (existing.quantity >= existing.availableQty) {
        toast.error(`Only ${existing.availableQty} available for ${existing.name}`);
        return;
      }
      toast.success(`Increased ${existing.name} quantity in cart!`);
      setCartItems((prev) =>
        prev.map((i) => (i.decorationId === item.decorationId ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      toast.success(`Added ${item.name} to cart!`);
      setCartItems((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (decorationId: string, quantity: number) => {
    const existing = cartItems.find((i) => i.decorationId === decorationId);
    if (!existing) return;
    if (quantity > existing.availableQty) {
      toast.error(`Only ${existing.availableQty} available for ${existing.name}`);
      return;
    }
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((i) => (i.decorationId === decorationId ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = (decorationId: string) => {
    setCartItems((prev) => prev.filter((i) => i.decorationId !== decorationId));
    toast.success("Item removed from cart");
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
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
