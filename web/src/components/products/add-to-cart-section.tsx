"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { b2cCartApi, getOrCreateGuestId } from "@/lib/api/b2c-cart";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  primaryImageUrl?: string;
  stockStatus: string;
}

interface AddToCartSectionProps {
  product: Product;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      getOrCreateGuestId();
      await b2cCartApi.addToCart({
        productId: product.id,
        productName: product.name,
        productSKU: product.sku,
        productImageUrl: product.primaryImageUrl,
        quantity: 1,
      });
      setAdded(true);
      toast.success("Added to cart", {
        action: {
          label: "View Cart",
          onClick: () => window.location.href = "/cart",
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = product.stockStatus !== "InStock";

  return (
    <div className="flex flex-col gap-3">
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
