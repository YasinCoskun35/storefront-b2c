"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENABLE_ORDERING } from "@/lib/config";

interface FilterCategory {
  id: string;
  name: string;
  parentId: string | null;
}

interface ProductFiltersProps {
  categories?: FilterCategory[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const selectedCategory = searchParams.get("categoryId") || "";

  const all = categories ?? [];
  const roots = all.filter((c) => !c.parentId);
  const childrenOf = (id: string) => all.filter((c) => c.parentId === id);
  // The root whose subcategories to show: the selected root, or the parent of the selected subcategory.
  const selected = all.find((c) => c.id === selectedCategory);
  const openRootId = selected ? (selected.parentId ?? selected.id) : "";
  const openChildren = openRootId ? childrenOf(openRootId) : [];

  // Bring the selected chip into view in the horizontally scrolling rows.
  const chipBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chipBarRef.current
      ?.querySelectorAll<HTMLElement>("[data-active='true']")
      .forEach((el) => el.scrollIntoView({ block: "nearest", inline: "center" }));
  }, [selectedCategory]);

  // Price range is only meaningful when ordering/pricing is enabled.
  const hasActiveFilters = Boolean(
    searchParams.get("categoryId") ||
      (ENABLE_ORDERING && (searchParams.get("minPrice") || searchParams.get("maxPrice")))
  );

  const selectCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }
    params.delete("pageNumber");
    router.push(`/products?${params.toString()}`);
  };

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    params.delete("pageNumber");
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  };

  const chip = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground/80 hover:bg-muted"
    );

  return (
    <>
      {/* Phones/tablets: one swipeable row of categories so products start above the fold */}
      <div ref={chipBarRef} className="-mx-4 space-y-2 lg:hidden">
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => selectCategory("")} className={chip(!selectedCategory)}>
            Tümü
          </button>
          {roots.map((c) => (
            <button
              key={c.id}
              data-active={openRootId === c.id}
              onClick={() => selectCategory(c.id)}
              className={chip(openRootId === c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        {openChildren.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {openChildren.map((c) => (
              <button
                key={c.id}
                data-active={selectedCategory === c.id}
                onClick={() => selectCategory(c.id)}
                className={cn(chip(selectedCategory === c.id), "py-1.5 text-xs")}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

    <div className="hidden space-y-6 rounded-xl border bg-card p-5 lg:block">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtreler
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            <X className="h-3 w-3" />
            Temizle
          </button>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">Kategoriler</h4>
        <div className="space-y-1">
          <button
            onClick={() => selectCategory("")}
            className={cn(
              "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-muted"
            )}
          >
            Tüm Kategoriler
          </button>
          {roots.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => selectCategory(category.id)}
                className={cn(
                  "block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted"
                )}
              >
                {category.name}
              </button>
              {openRootId === category.id && openChildren.length > 0 && (
                <div className="ml-3 mt-1 space-y-1 border-l pl-2">
                  {openChildren.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => selectCategory(sub.id)}
                      className={cn(
                        "block w-full truncate rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                        selectedCategory === sub.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {ENABLE_ORDERING && (
        <div className="border-t pt-5">
          <h4 className="mb-3 text-sm font-medium text-foreground">Fiyat Aralığı</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
                En Az
              </Label>
              <Input
                id="minPrice"
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">
                En Çok
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min={0}
                placeholder="Farketmez"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={applyPriceRange} className="mt-3 w-full" size="sm">
            Uygula
          </Button>
        </div>
      )}
    </div>
    </>
  );
}
