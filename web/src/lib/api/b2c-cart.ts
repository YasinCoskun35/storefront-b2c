import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================
// Guest ID management
// ============================================

const GUEST_ID_KEY = 'b2c_guest_id';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GUEST_ID_KEY);
}

export function clearGuestId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_ID_KEY);
  }
}

// ============================================
// Types
// ============================================

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  productImageUrl?: string;
  quantity: number;
  colorChartId?: string;
  colorChartName?: string;
  colorOptionId?: string;
  colorOptionName?: string;
  colorOptionCode?: string;
  customizationNotes?: string;
}

export interface Cart {
  id: string;
  itemCount: number;
  items: CartItem[];
}

export interface AddToCartPayload {
  productId: string;
  productName: string;
  productSKU: string;
  productImageUrl?: string;
  quantity: number;
  colorChartId?: string;
  colorChartName?: string;
  colorOptionId?: string;
  colorOptionName?: string;
  colorOptionCode?: string;
  customizationNotes?: string;
}

export interface CheckoutPayload {
  guestEmail: string;
  guestName: string;
  guestPhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryNotes?: string;
  notes?: string;
}

// ============================================
// API client factory (adds X-Guest-Id header)
// ============================================

function guestClient() {
  const guestId = getOrCreateGuestId();
  return axios.create({
    baseURL: API_URL,
    headers: { 'X-Guest-Id': guestId },
  });
}

// ============================================
// B2C Cart API
// ============================================

export const b2cCartApi = {
  getCart: async (): Promise<Cart> => {
    const { data } = await guestClient().get<Cart>('/api/cart');
    return data;
  },

  addToCart: async (payload: AddToCartPayload): Promise<{ cartId: string }> => {
    const { data } = await guestClient().post<{ cartId: string }>('/api/cart/items', payload);
    return data;
  },

  updateQuantity: async (itemId: string, quantity: number): Promise<void> => {
    await guestClient().put(`/api/cart/items/${itemId}`, { quantity });
  },

  removeItem: async (itemId: string): Promise<void> => {
    await guestClient().delete(`/api/cart/items/${itemId}`);
  },

  checkout: async (payload: CheckoutPayload): Promise<{ orderId: string }> => {
    const { data } = await guestClient().post<{ orderId: string }>('/api/cart/checkout', payload);
    return data;
  },

  initializePayment: async (orderId: string): Promise<{ token: string; paymentPageUrl: string }> => {
    const { data } = await guestClient().post<{ token: string; paymentPageUrl: string }>(
      '/api/b2c/payments/initialize',
      { orderId }
    );
    return data;
  },
};
