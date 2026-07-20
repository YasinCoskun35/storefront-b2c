"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  categories?: Array<{ id: string; name: string }>;
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const selectedCategory = searchParams.get("categoryId") || "";

  const hasActiveFilters = Boolean(
    searchParams.get("categoryId") || searchParams.get("minPrice") || searchParams.get("maxPrice")
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

  return (
    <div className="space-y-6 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">Categories</h4>
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
            All Categories
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
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
          ))}
        </div>
      </div>

      <div className="border-t pt-5">
        <h4 className="mb-3 text-sm font-medium text-foreground">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
              Min
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
              Max
            </Label>
            <Input
              id="maxPrice"
              type="number"
              min={0}
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={applyPriceRange} className="mt-3 w-full" size="sm">
          Apply
        </Button>
      </div>
    </div>
  );
}
