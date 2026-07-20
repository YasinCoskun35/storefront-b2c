"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/products/product-image";
import { formatPrice } from "@/lib/utils";
import { b2cCartApi } from "@/lib/api/b2c-cart";
import { usePricedCart } from "@/lib/hooks/use-priced-cart";
import { toast } from "sonner";

interface CheckoutForm {
  guestEmail: string;
  guestName: string;
  guestPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryNotes: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, prices, loading, hasAllPrices, subtotal } = usePricedCart();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    guestEmail: "",
    guestName: "",
    guestPhone: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPostalCode: "",
    deliveryCountry: "Turkey",
    deliveryNotes: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.guestEmail || !form.guestName || !form.deliveryAddress || !form.deliveryCity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { orderId } = await b2cCartApi.checkout({
        guestEmail: form.guestEmail,
        guestName: form.guestName,
        guestPhone: form.guestPhone || undefined,
        deliveryAddress: form.deliveryAddress,
        deliveryCity: form.deliveryCity,
        deliveryState: form.deliveryState,
        deliveryPostalCode: form.deliveryPostalCode,
        deliveryCountry: form.deliveryCountry,
        deliveryNotes: form.deliveryNotes || undefined,
        notes: form.notes || undefined,
      });

      const { paymentPageUrl } = await b2cCartApi.initializePayment(orderId);

      // Redirect to iyzico hosted payment page
      window.location.href = paymentPageUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Checkout failed");
      setSubmitting(false);
    }
  };

  if (!loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some products before checking out.</p>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Contact Information</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  name="guestName"
                  value={form.guestName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  name="guestEmail"
                  type="email"
                  value={form.guestEmail}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone</Label>
              <Input
                id="guestPhone"
                name="guestPhone"
                value={form.guestPhone}
                onChange={handleChange}
                placeholder="+90 555 000 0000"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Shipping Address</h2>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Address *</Label>
              <Input
                id="deliveryAddress"
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                placeholder="Street address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">City *</Label>
                <Input
                  id="deliveryCity"
                  name="deliveryCity"
                  value={form.deliveryCity}
                  onChange={handleChange}
                  placeholder="Istanbul"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">State / Province</Label>
                <Input
                  id="deliveryState"
                  name="deliveryState"
                  value={form.deliveryState}
                  onChange={handleChange}
                  placeholder="Istanbul"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryPostalCode">Postal Code</Label>
                <Input
                  id="deliveryPostalCode"
                  name="deliveryPostalCode"
                  value={form.deliveryPostalCode}
                  onChange={handleChange}
                  placeholder="34000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryCountry">Country</Label>
                <Input
                  id="deliveryCountry"
                  name="deliveryCountry"
                  value={form.deliveryCountry}
                  onChange={handleChange}
                  placeholder="Turkey"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                name="deliveryNotes"
                value={form.deliveryNotes}
                onChange={handleChange}
                placeholder="Any special delivery instructions..."
                rows={2}
              />
            </div>
          </div>

          {/* Order Notes */}
          <div className="space-y-2 rounded-xl border bg-card p-6">
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes for your order..."
              rows={3}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || loading}>
            <Lock className="mr-2 h-4 w-4" />
            {submitting ? "Processing..." : "Continue to Secure Payment"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payment is processed securely through iyzico
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Order Summary</h2>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading cart...</p>
            ) : (
              <>
                <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {cart?.items.map((item) => {
                    const unitPrice = prices[item.productId];
                    return (
                      <li key={item.id} className="flex gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          <ProductImage src={item.productImageUrl} alt={item.productName} />
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <p className="truncate text-sm font-medium">{item.productName}</p>
                          {unitPrice != null && (
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(unitPrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  {hasAllPrices ? (
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and tax, if any, are finalized on the payment page.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
