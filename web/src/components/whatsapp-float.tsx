"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { settingsApi } from "@/lib/api";
import { buildWhatsAppLink } from "@/lib/config";

/**
 * Floating "chat on WhatsApp" button, shown on storefront pages once a WhatsApp
 * number is configured in admin settings. Hidden on admin/login screens.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    settingsApi
      .get()
      .then((s) => {
        if (active) setLink(buildWhatsAppLink(s.whatsAppNumber, s.whatsAppMessage));
      })
      .catch(() => {
        /* settings unavailable — simply don't show the button */
      });
    return () => {
      active = false;
    };
  }, []);

  const hidden = pathname?.startsWith("/admin") || pathname?.startsWith("/login");
  if (hidden || !link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
