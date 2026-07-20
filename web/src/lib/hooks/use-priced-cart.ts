import { useCallback, useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import { b2cCartApi, getOrCreateGuestId, type Cart } from "@/lib/api/b2c-cart";

export function usePricedCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    getOrCreateGuestId();
    const data = await b2cCartApi.getCart();
    setCart(data);

    const uniqueProductIds = Array.from(new Set(data.items.map((i) => i.productId)));
    const priceEntries = await Promise.all(
      uniqueProductIds.map(async (productId) => {
        try {
          const product = await catalogApi.getProductById(productId);
          return [productId, product.price] as const;
        } catch {
          return [productId, null] as const;
        }
      })
    );
    setPrices(
      Object.fromEntries(priceEntries.filter(([, price]) => price != null)) as Record<
        string,
        number
      >
    );
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const hasAllPrices = cart ? cart.items.every((item) => prices[item.productId] != null) : false;
  const subtotal = cart
    ? cart.items.reduce((sum, item) => sum + (prices[item.productId] ?? 0) * item.quantity, 0)
    : 0;

  return { cart, prices, loading, hasAllPrices, subtotal, reload };
}
