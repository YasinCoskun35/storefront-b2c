"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearGuestId } from "@/lib/api/b2c-cart";
import { notifyCartUpdated } from "@/lib/cart-events";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Clear guest cart after successful payment
    clearGuestId();
    notifyCartUpdated();
  }, []);

  return (
    <div className="container mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-11 w-11 text-success" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Siparişiniz Alındı!</h1>
      <p className="mt-3 text-muted-foreground">
        Siparişiniz için teşekkürler. Siparişinizi aldık; detayları onaylamak,
        ödeme ve teslimatı ayarlamak için kısa süre içinde sizinle iletişime geçeceğiz.
      </p>
      {orderId && (
        <p className="mt-3 rounded-lg border bg-muted/50 px-4 py-2 font-mono text-sm">
          Sipariş No: {orderId}
        </p>
      )}
      <p className="mt-4 text-sm text-muted-foreground">
        Lütfen sipariş numaranızı saklayın.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/products">
          <Button size="lg">Alışverişe Devam Et</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
