"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi, Product } from "@/lib/api";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

const STOCK_STATUS_LABELS: Record<string, string> = {
  InStock: "Stokta",
  LowStock: "Son Ürünler",
  OutOfStock: "Tükendi",
  Discontinued: "Satıştan Kalktı",
  PreOrder: "Ön Sipariş",
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [stockStatus, setStockStatus] = useState<string>("all");
  const [isActive, setIsActive] = useState<string>("all");
  const queryClient = useQueryClient();

  // Debounce the free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: true }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, searchTerm, categoryId, stockStatus, isActive],
    queryFn: () =>
      catalogApi.searchProducts({
        pageNumber: page,
        pageSize: 10,
        searchTerm: searchTerm || undefined,
        categoryId: categoryId === "all" ? undefined : categoryId,
        stockStatus: stockStatus === "all" ? undefined : stockStatus,
        isActive: isActive === "all" ? undefined : isActive === "active",
      }),
  });

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Ürün silindi");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Ürün silinemedi");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: "Görsel",
      accessor: (row: Product) => (
        <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
          {row.primaryImageUrl && (
            <Image
              src={getImageUrl(row.primaryImageUrl)}
              alt={row.name}
              fill
              className="object-cover"
            />
          )}
        </div>
      ),
    },
    {
      header: "Ad",
      accessor: "name" as keyof Product,
      cell: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      header: "Stok Kodu",
      accessor: "sku" as keyof Product,
    },
    {
      header: "Fiyat",
      accessor: "price" as keyof Product,
      cell: (value: number) => formatPrice(value),
    },
    {
      header: "Stok",
      accessor: "stockStatus" as keyof Product,
      cell: (value: string, row: Product) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === "InStock"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value} ({row.quantity})
        </span>
      ),
    },
    {
      header: "İşlemler",
      accessor: (row: Product) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${row.id}`}>
            <Button variant="ghost" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => handleDelete(row.id, row.name)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ürünler</h1>
          <p className="text-muted-foreground">
            Ürün kataloğunuzu yönetin
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ürün Ekle
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ürün adı veya stok kodu ara..."
            className="pl-9"
          />
        </div>

        <Select value={categoryId} onValueChange={handleFilterChange(setCategoryId)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockStatus} onValueChange={handleFilterChange(setStockStatus)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Stok Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Stok Durumları</SelectItem>
            {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={handleFilterChange(setIsActive)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div>Yükleniyor...</div>
      ) : data && data.items.length === 0 ? (
        <p className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          Filtrelere uyan ürün bulunamadı.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          currentPage={page}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

