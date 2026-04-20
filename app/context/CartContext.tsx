"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export interface CartItem {
  decorationId: string;
  name: string;
  price: number;
  priceUnitHours?: number;
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
    let existingIndex = -1;
    for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].decorationId === item.decorationId) {
            existingIndex = i;
            break;
        }
    }

    if (existingIndex !== -1) {
      const existing = cartItems[existingIndex];
      if (existing.quantity >= existing.availableQty) {
        toast.error(`Only ${existing.availableQty} available for ${existing.name}`);
        return;
      }
      toast.success(`Increased ${existing.name} quantity in cart!`);
      
      const newItems = [];
      for (let i = 0; i < cartItems.length; i++) {
          if (i === existingIndex) {
              newItems.push({ ...cartItems[i], quantity: cartItems[i].quantity + 1 });
          } else {
              newItems.push(cartItems[i]);
          }
      }
      setCartItems(newItems);
    } else {
      toast.success(`Added ${item.name} to cart!`);
      const newItems = [];
      for (let i = 0; i < cartItems.length; i++) {
          newItems.push(cartItems[i]);
      }
      newItems.push({ ...item, quantity: 1 });
      setCartItems(newItems);
    }
  };

  const updateQuantity = (decorationId: string, quantity: number) => {
    let existingIndex = -1;
    for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].decorationId === decorationId) {
            existingIndex = i;
            break;
        }
    }
    
    if (existingIndex === -1) return;
    const existing = cartItems[existingIndex];
    
    if (quantity > existing.availableQty) {
      toast.error(`Only ${existing.availableQty} available for ${existing.name}`);
      return;
    }
    if (quantity < 1) return;

    const newItems = [];
    for (let i = 0; i < cartItems.length; i++) {
        if (i === existingIndex) {
            newItems.push({ ...cartItems[i], quantity: quantity });
        } else {
            newItems.push(cartItems[i]);
        }
    }
    setCartItems(newItems);
  };

  const removeFromCart = (decorationId: string) => {
    const newItems = [];
    for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].decorationId !== decorationId) {
            newItems.push(cartItems[i]);
        }
    }
    setCartItems(newItems);
    toast.success("Item removed from cart");
  };

  const clearCart = () => setCartItems([]);

  let totalItemsCount = 0;
  for (let i = 0; i < cartItems.length; i++) {
      totalItemsCount += cartItems[i].quantity;
  }
  const totalItems = totalItemsCount;

  let totalItemsPrice = 0;
  for (let i = 0; i < cartItems.length; i++) {
      totalItemsPrice += cartItems[i].price * cartItems[i].quantity;
  }
  const totalPrice = totalItemsPrice;

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
