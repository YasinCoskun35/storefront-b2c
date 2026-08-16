"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductImage } from "@/components/products/product-image";
import { formatPrice } from "@/lib/utils";
import { b2cCartApi } from "@/lib/api/b2c-cart";
import { usePricedCart } from "@/lib/hooks/use-priced-cart";
import { ENABLE_ORDERING } from "@/lib/config";
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
  // Ordering is disabled — checkout is not available in catalog-only mode.
  if (!ENABLE_ORDERING) notFound();

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
    deliveryCountry: "Türkiye",
    deliveryNotes: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.guestEmail || !form.guestName || !form.deliveryAddress || !form.deliveryCity) {
      toast.error("Lütfen zorunlu alanları doldurun");
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

      // No online payment — order is placed and the shop follows up to arrange payment/delivery.
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Sipariş tamamlanamadı");
      setSubmitting(false);
    }
  };

  if (!loading && (!cart || cart.items.length === 0)) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Sepetiniz boş</h1>
        <p className="text-muted-foreground">Ödeme yapmadan önce sepetinize ürün ekleyin.</p>
        <Link href="/products">
          <Button size="lg">Ürünleri İncele</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-display text-3xl font-bold">Ödeme</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">İletişim Bilgileri</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Ad Soyad *</Label>
                <Input
                  id="guestName"
                  name="guestName"
                  value={form.guestName}
                  onChange={handleChange}
                  placeholder="Ad Soyad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">E-posta *</Label>
                <Input
                  id="guestEmail"
                  name="guestEmail"
                  type="email"
                  value={form.guestEmail}
                  onChange={handleChange}
                  placeholder="ornek@eposta.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Telefon</Label>
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
            <h2 className="font-display text-xl font-semibold">Teslimat Adresi</h2>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Adres *</Label>
              <Input
                id="deliveryAddress"
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                placeholder="Sokak / cadde adresi"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">Şehir *</Label>
                <Input
                  id="deliveryCity"
                  name="deliveryCity"
                  value={form.deliveryCity}
                  onChange={handleChange}
                  placeholder="İstanbul"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">İl / İlçe</Label>
                <Input
                  id="deliveryState"
                  name="deliveryState"
                  value={form.deliveryState}
                  onChange={handleChange}
                  placeholder="İstanbul"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryPostalCode">Posta Kodu</Label>
                <Input
                  id="deliveryPostalCode"
                  name="deliveryPostalCode"
                  value={form.deliveryPostalCode}
                  onChange={handleChange}
                  placeholder="34000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryCountry">Ülke</Label>
                <Input
                  id="deliveryCountry"
                  name="deliveryCountry"
                  value={form.deliveryCountry}
                  onChange={handleChange}
                  placeholder="Türkiye"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Teslimat Notları</Label>
              <Textarea
                id="deliveryNotes"
                name="deliveryNotes"
                value={form.deliveryNotes}
                onChange={handleChange}
                placeholder="Özel teslimat talimatları..."
                rows={2}
              />
            </div>
          </div>

          {/* Order Notes */}
          <div className="space-y-2 rounded-xl border bg-card p-6">
            <Label htmlFor="notes">Sipariş Notları</Label>
            <Textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Siparişinizle ilgili ek notlar..."
              rows={3}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || loading}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            {submitting ? "Sipariş veriliyor..." : "Siparişi Ver"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Online ödeme gerekmez — siparişinizi onaylamak ve ödemeyi ayarlamak için sizinle iletişime geçeceğiz.
          </p>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Sipariş Özeti</h2>

            {loading ? (
              <p className="text-sm text-muted-foreground">Sepet yükleniyor...</p>
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
                  <span className="text-muted-foreground">Ara Toplam</span>
                  {hasAllPrices ? (
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kargo ve nihai tutar, mağaza sizinle iletişime geçtiğinde onaylanır.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
