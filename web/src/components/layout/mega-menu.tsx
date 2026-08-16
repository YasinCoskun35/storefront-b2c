"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogApi, type Category } from "@/lib/api";

export interface CategoryNode extends Category {
  children: Category[];
}

/**
 * Fetches active categories and groups them into a parent → children tree.
 * Shared by the desktop mega menu and the mobile category list.
 */
export function useCategoryTree() {
  const { data } = useQuery({
    queryKey: ["categories", "nav"],
    queryFn: () => catalogApi.getAllCategories(),
    staleTime: 5 * 60 * 1000,
  });

  return useMemo<CategoryNode[]>(() => {
    const active = (data ?? []).filter((c) => c.isActive);
    const ids = new Set(active.map((c) => c.id));
    const byParent = new Map<string, Category[]>();

    for (const c of active) {
      if (c.parentId && ids.has(c.parentId)) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      }
    }

    const sort = (a: Category, b: Category) =>
      a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "tr");

    return active
      .filter((c) => !c.parentId || !ids.has(c.parentId))
      .sort(sort)
      .map((c) => ({ ...c, children: (byParent.get(c.id) ?? []).sort(sort) }));
  }, [data]);
}

/** Desktop mega menu triggered by the "Ürünler" nav item. */
export function CategoryMegaMenu() {
  const pathname = usePathname();
  const tree = useCategoryTree();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = pathname === "/products" || pathname.startsWith("/products");

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // Small delay so diagonally moving the cursor into the panel doesn't close it.
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const hasCategories = tree.length > 0;

  return (
    <div
      className="static"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocusCapture={openNow}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link
        href="/products"
        aria-expanded={open}
        aria-haspopup={hasCategories ? "true" : undefined}
        className={cn(
          "flex items-center gap-1 transition-colors hover:text-primary",
          isActive ? "text-primary" : "text-foreground/80"
        )}
      >
        Ürünler
        {hasCategories && (
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        )}
      </Link>

      {hasCategories && (
        <div
          className={cn(
            "absolute inset-x-0 top-full z-40 border-b bg-popover text-popover-foreground shadow-lg transition-all duration-150",
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-1 opacity-0"
          )}
          role="menu"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 gap-x-8 gap-y-7 md:grid-cols-3 lg:grid-cols-4">
              {tree.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/products?categoryId=${cat.id}`}
                    className="group flex items-center justify-between font-display text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {cat.name}
                    <span className="text-xs font-normal text-muted-foreground">
                      {cat.productCount}
                    </span>
                  </Link>

                  {cat.children.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/products?categoryId=${sub.id}`}
                            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Tüm Ürünleri Gör
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Mobile category list, rendered inside the slide-out menu. */
export function MobileCategoryLinks({ onNavigate }: { onNavigate?: () => void }) {
  const tree = useCategoryTree();
  if (tree.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Kategoriler
      </p>
      <ul className="space-y-0.5">
        {tree.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/products?categoryId=${cat.id}`}
              onClick={onNavigate}
              className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {cat.name}
            </Link>
            {cat.children.length > 0 && (
              <ul className="ml-3 border-l pl-3">
                {cat.children.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/products?categoryId=${sub.id}`}
                      onClick={onNavigate}
                      className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
