"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutFailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="container mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-11 w-11 text-destructive" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Payment Failed</h1>
      <p className="mt-3 text-muted-foreground">
        {error || "Your payment could not be processed. Please try again."}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/cart">
          <Button size="lg">Return to Cart</Button>
        </Link>
        <Link href="/products">
          <Button size="lg" variant="outline">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutFailContent />
    </Suspense>
  );
}
