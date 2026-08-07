const CART_UPDATED_EVENT = "storefront:cart-updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function subscribeToCartUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_UPDATED_EVENT, callback);
  return () => window.removeEventListener(CART_UPDATED_EVENT, callback);
}
