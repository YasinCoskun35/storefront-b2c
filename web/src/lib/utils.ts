import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price);
}

// Public base URL of the API/uploads, used to resolve relative image paths in
// the browser. Set NEXT_PUBLIC_API_URL to your API's public origin in production.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function getImageUrl(url: string): string;
export function getImageUrl(url: string | undefined): string | null;
export function getImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // If URL starts with /, it's a relative URL from the API
  if (url.startsWith("/")) {
    return `${PUBLIC_API_URL}${url}`;
  }

  return url;
}

