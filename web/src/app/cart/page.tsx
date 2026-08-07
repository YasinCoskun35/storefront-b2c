"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";
import { formatPrice } from "@/lib/utils";
import { b2cCartApi } from "@/lib/api/b2c-cart";
import { notifyCartUpdated } from "@/lib/cart-events";
import { usePricedCart } from "@/lib/hooks/use-priced-cart";
import { toast } from "sonner";

export default function CartPage() {
  const { cart, prices, loading, hasAllPrices, subtotal, reload } = usePricedCart();
  const router = useRouter();

  const handleRemove = async (itemId: string) => {
    try {
      await b2cCartApi.removeItem(itemId);
      await reload();
      notifyCartUpdated();
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await b2cCartApi.updateQuantity(itemId, quantity);
      await reload();
      notifyCartUpdated();
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our products and add items to your cart.
          </p>
        </div>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold">
        Shopping Cart <span className="text-muted-foreground">({cart.itemCount})</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => {
            const unitPrice = prices[item.productId];
            return (
              <div key={item.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <ProductImage src={item.productImageUrl} alt={item.productName} />
                </div>

                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-medium hover:text-primary"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-muted-foreground">SKU: {item.productSKU}</p>
                    </div>
                    {unitPrice != null && (
                      <span className="font-semibold">{formatPrice(unitPrice * item.quantity)}</span>
                    )}
                  </div>

                  {item.colorOptionName && (
                    <p className="text-sm text-muted-foreground">
                      Color: {item.colorOptionName}
                      {item.colorOptionCode && ` (${item.colorOptionCode})`}
                    </p>
                  )}
                  {item.customizationNotes && (
                    <p className="text-sm text-muted-foreground">Note: {item.customizationNotes}</p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{cart.itemCount}</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              {hasAllPrices ? (
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              ) : (
                <span className="text-muted-foreground">Calculated at checkout</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and any applicable tax are calculated during checkout.
            </p>
            <div className="pt-2">
              <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <Link
              href="/products"
              className="block text-center text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
