"use client";

import { useCart } from "@/app/context/CartContext";
import { ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  item: {
    id: string;
    name: string;
    price: number;
    availableQty: number;
    image?: string | null;
  };
}

export function AddToCartButton({ item }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  return (
    <button
      onClick={() =>
        addToCart({
          decorationId: item.id,
          name: item.name,
          price: item.price,
          availableQty: item.availableQty,
          image: item.image,
        })
      }
      className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Add to Cart
    </button>
  );
}
