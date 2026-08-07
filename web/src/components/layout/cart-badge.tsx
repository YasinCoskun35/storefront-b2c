"use client";

import { useEffect, useState } from "react";
import { b2cCartApi, getGuestId } from "@/lib/api/b2c-cart";
import { subscribeToCartUpdates } from "@/lib/cart-events";

export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!getGuestId()) {
        setCount(0);
        return;
      }
      try {
        const cart = await b2cCartApi.getCart();
        setCount(cart.itemCount);
      } catch {
        // Silently ignore - cart badge is a non-critical enhancement
      }
    };

    load();
    return subscribeToCartUpdates(load);
  }, []);

  return count;
}

export function CartCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
