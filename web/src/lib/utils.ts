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

export function getImageUrl(url: string): string;
export function getImageUrl(url: string | undefined): string | null;
export function getImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // If URL starts with /, it's a relative URL from the API
  if (url.startsWith("/")) {
    return `http://localhost:8080${url}`;
  }

  return url;
}

