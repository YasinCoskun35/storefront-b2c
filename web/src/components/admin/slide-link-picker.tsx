"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { catalogApi } from "@/lib/api";
import { Loader2, Search } from "lucide-react";

interface SlideLinkPickerProps {
  onSelect: (link: string) => void;
}

// Quick-pick helpers shown under the manual "Düğme Bağlantısı" input: jump to a
// category or search a product by SKU/name instead of typing the URL by hand.
export function SlideLinkPicker({ onSelect }: SlideLinkPickerProps) {
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <CategoryPicker onSelect={onSelect} />
      <ProductPicker onSelect={onSelect} />
    </div>
  );
}

function CategoryPicker({ onSelect }: { onSelect: (link: string) => void }) {
  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: false }),
  });

  return (
    <Select
      value=""
      onValueChange={(categoryId) => onSelect(`/products?categoryId=${categoryId}`)}
    >
      <SelectTrigger className="sm:w-56">
        <SelectValue placeholder="Kategoriden seç..." />
      </SelectTrigger>
      <SelectContent>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProductPicker({ onSelect }: { onSelect: (link: string) => void }) {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["slide-link-product-search", query],
    queryFn: () => catalogApi.searchProducts({ searchTerm: query, pageSize: 8 }),
    enabled: query.trim().length > 0,
  });

  const runSearch = () => setQuery(term.trim());
  const results = query.trim().length > 0 ? data?.items ?? [] : [];

  return (
    <div className="relative flex-1">
      <div className="flex gap-2">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="SKU veya ürün adıyla ara..."
        />
        <Button type="button" variant="outline" size="icon" onClick={runSearch} disabled={!term.trim()}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {query.trim().length > 0 && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover shadow-sm">
          {isFetching ? (
            <p className="p-2 text-sm text-muted-foreground">Aranıyor...</p>
          ) : results.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Sonuç bulunamadı.</p>
          ) : (
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onSelect(`/products/${product.id}`);
                  setQuery("");
                  setTerm("");
                }}
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
