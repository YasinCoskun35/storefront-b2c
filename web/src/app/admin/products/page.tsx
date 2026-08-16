"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi, Product } from "@/lib/api";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page],
    queryFn: () => catalogApi.searchProducts({ pageNumber: page, pageSize: 10 }),
  });

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

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

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

      <DataTable
        columns={columns}
        data={data?.items || []}
        currentPage={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}

