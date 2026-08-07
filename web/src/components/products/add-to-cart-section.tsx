"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { b2cCartApi, getOrCreateGuestId } from "@/lib/api/b2c-cart";
import { notifyCartUpdated } from "@/lib/cart-events";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  primaryImageUrl?: string;
  stockStatus: string;
  quantity: number;
}

interface AddToCartSectionProps {
  product: Product;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stockStatus === "OutOfStock" || product.stockStatus === "Discontinued";
  const maxQuantity = Math.max(1, Math.min(product.quantity || 1, 99));

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      getOrCreateGuestId();
      await b2cCartApi.addToCart({
        productId: product.id,
        productName: product.name,
        productSKU: product.sku,
        productImageUrl: product.primaryImageUrl,
        quantity,
      });
      setAdded(true);
      notifyCartUpdated();
      toast.success(`Added ${quantity} to cart`, {
        action: {
          label: "View Cart",
          onClick: () => (window.location.href = "/cart"),
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              disabled={quantity >= maxQuantity}
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={isOutOfStock || adding}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isOutOfStock ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
      </Button>

      {added && (
        <Link href="/cart">
          <Button size="lg" variant="outline" className="w-full">
            View Cart
          </Button>
        </Link>
      )}
    </div>
  );
}
