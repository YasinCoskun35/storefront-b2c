"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearGuestId } from "@/lib/api/b2c-cart";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Clear guest cart after successful payment
    clearGuestId();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-6 max-w-lg">
      <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
      <h1 className="text-3xl font-bold">Payment Successful!</h1>
      <p className="text-muted-foreground">
        Thank you for your order. Your payment has been processed successfully.
        {orderId && (
          <span className="block mt-2 text-sm font-mono">Order ID: {orderId}</span>
        )}
      </p>
      <p className="text-muted-foreground text-sm">
        You will receive a confirmation email shortly.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
