"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { b2cCartApi } from "@/lib/api/b2c-cart";
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Contact Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Shipping Address</h2>

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
        <div className="space-y-2">
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

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Processing..." : "Proceed to Payment"}
        </Button>
      </form>
    </div>
  );
}
