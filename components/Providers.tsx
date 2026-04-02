"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/app/context/CartContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster position="bottom-right" />
      </CartProvider>
    </SessionProvider>
  );
}
