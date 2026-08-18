"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { buildWhatsAppLink } from "@/lib/config";

interface ProductInquiryProps {
  productName: string;
  stockStatus: string;
  whatsAppNumber?: string;
}

/**
 * Shown in place of add-to-cart when ordering is disabled: invites the customer
 * to ask about the product on WhatsApp (or the contact page as a fallback).
 *
 * The product link is read from window.location at click time (not passed down
 * from the server) so it works regardless of proxy/header setup.
 */
export function ProductInquiry({ productName, stockStatus, whatsAppNumber }: ProductInquiryProps) {
  const isUnavailable = stockStatus === "OutOfStock" || stockStatus === "Discontinued";
  const hasWhatsApp = !!buildWhatsAppLink(whatsAppNumber);

  const handleClick = () => {
    const message = `Merhaba! "${productName}" ürünüyle ilgileniyorum. Detayları${
      isUnavailable ? " ve stok durumunu" : ""
    } paylaşabilir misiniz?\n${window.location.href}`;
    const waLink = buildWhatsAppLink(whatsAppNumber, message);
    if (waLink) window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-3">
      {hasWhatsApp ? (
        <Button
          type="button"
          size="lg"
          className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5d]"
          onClick={handleClick}
        >
          <WhatsAppIcon className="mr-2 h-5 w-5" />
          Bu ürünü sor
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href="/contact">Bu ürün için bize ulaşın</Link>
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Stok durumu, fiyat ve teslimat için bize yazın.
      </p>
    </div>
  );
}
