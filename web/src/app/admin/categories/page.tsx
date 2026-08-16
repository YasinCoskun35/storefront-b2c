"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: true }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Kategori silindi");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Kategori silinemedi");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Kategoriler</h1>
          <p className="text-muted-foreground">Ürün kategorilerini yönetin</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Kategori Ekle
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Ad</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Kısa Ad</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ürünler</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Durum</th>
              <th className="px-4 py-3 text-left text-sm font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {categories?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Henüz kategori yok.
                </td>
              </tr>
            )}
            {categories?.map((category) => (
              <tr key={category.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 text-sm font-medium">{category.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                  {category.slug}
                </td>
                <td className="px-4 py-3 text-sm">{category.productCount}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    className={category.isActive
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {category.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/categories/${category.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(category.id, category.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
