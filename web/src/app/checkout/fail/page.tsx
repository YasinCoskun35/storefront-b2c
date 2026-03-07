"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-6 max-w-lg">
      <XCircle className="mx-auto h-20 w-20 text-destructive" />
      <h1 className="text-3xl font-bold">Payment Failed</h1>
      <p className="text-muted-foreground">
        {error || "Your payment could not be processed. Please try again."}
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/cart">
          <Button size="lg">Return to Cart</Button>
        </Link>
        <Link href="/products">
          <Button size="lg" variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
