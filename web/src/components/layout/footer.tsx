import Link from "next/link";
import { Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import { catalogApi } from "@/lib/api";

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
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Storefront</span>
            </Link>
            <p className="max-w-xs text-sm text-secondary-foreground/70">
              Your trusted hardware store for quality tools and equipment,
              delivered to your door.
            </p>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@storefront.com" className="hover:text-primary">
                  info@storefront.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>+90 555 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>Istanbul, Turkey</span>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground/50">
              Products
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-secondary-foreground/70 hover:text-primary">
                  All Products
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
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-secondary-foreground/70 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-secondary-foreground/70 hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary-foreground/70 hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-secondary-foreground/50">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-secondary-foreground/70 hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-secondary-foreground/70 hover:text-primary">
                  Your Cart
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-secondary-foreground/10 pt-8 text-sm text-secondary-foreground/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Storefront. All rights reserved.</p>
          <p>Secure checkout powered by iyzico</p>
        </div>
      </div>
    </footer>
  );
}
