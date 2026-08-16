import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { catalogApi } from "@/lib/api";
import { ENABLE_ORDERING } from "@/lib/config";

export async function Footer() {
  let topCategories: { id: string; name: string }[] = [];
  try {
    const categories = await catalogApi.getCategories();
    topCategories = categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 4);
  } catch {
    // Footer should never break the page if the API is unreachable
  }

  return (
    <footer className="border-t bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-display">
              <Image src="/logo-icon.svg" alt="Harun Yapı Market" width={28} height={28} />
              <span className="text-lg font-bold">Harun Yapı Market</span>
            </Link>
            <p className="max-w-xs text-sm text-secondary-foreground/70">
              Kaliteli el aletleri, hırdavat ve yapı malzemeleri için
              güvenilir adresiniz.
            </p>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@harunyapimarket.com" className="hover:text-primary">
                  info@harunyapimarket.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+905398282062" className="hover:text-primary">
                  0539 828 20 62
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Seyhan, Aydın Hatboyu Cd. No:470 D:A, 35380 Buca/İzmir</span>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground/50">
              Ürünler
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-secondary-foreground/70 hover:text-primary">
                  Tüm Ürünler
                </Link>
              </li>
              {topCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?categoryId=${category.id}`}
                    className="text-secondary-foreground/70 hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground/50">
              Kurumsal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-secondary-foreground/70 hover:text-primary">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary-foreground/70 hover:text-primary">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground/50">
              Destek
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-secondary-foreground/70 hover:text-primary">
                  Yardım Merkezi
                </Link>
              </li>
              {ENABLE_ORDERING && (
                <li>
                  <Link href="/cart" className="text-secondary-foreground/70 hover:text-primary">
                    Sepetiniz
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-secondary-foreground/10 pt-8 text-sm text-secondary-foreground/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Harun Yapı Market. Tüm hakları saklıdır.</p>
          <p>Güvenli ödeme altyapısı: iyzico</p>
        </div>
      </div>
    </footer>
  );
}
