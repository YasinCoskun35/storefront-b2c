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
 */
export function ProductInquiry({ productName, stockStatus, whatsAppNumber }: ProductInquiryProps) {
  const isUnavailable = stockStatus === "OutOfStock" || stockStatus === "Discontinued";
  const message = `Hi! I'm interested in "${productName}". Could you share more details${
    isUnavailable ? " and availability" : ""
  }?`;
  const waLink = buildWhatsAppLink(whatsAppNumber, message);

  return (
    <div className="flex flex-col gap-3">
      {waLink ? (
        <Button asChild size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5d]">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="mr-2 h-5 w-5" />
            Ask about this product
          </a>
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link href="/contact">Contact us about this product</Link>
        </Button>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Message us to check availability, pricing, and delivery.
      </p>
    </div>
  );
}
