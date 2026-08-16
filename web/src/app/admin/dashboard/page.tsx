"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, FolderTree } from "lucide-react";

export default function AdminDashboardPage() {
  // Fetch stats
  const { data: productsData } = useQuery({
    queryKey: ["admin-products-stats"],
    queryFn: () => catalogApi.searchProducts({ pageSize: 1 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories-stats"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: true }),
  });

  // Count products that need restocking (low stock / out of stock).
  const { data: lowStockData } = useQuery({
    queryKey: ["admin-lowstock-stats"],
    queryFn: () => catalogApi.searchProducts({ pageSize: 500 }),
  });
  const lowStockCount =
    lowStockData?.items.filter(
      (p) => p.stockStatus === "LowStock" || p.stockStatus === "OutOfStock"
    ).length ?? 0;

  const stats = [
    {
      title: "Toplam Ürün",
      value: productsData?.totalCount || 0,
      icon: Package,
      description: "Katalogdaki ürünler",
    },
    {
      title: "Stoğu Azalan / Tükenen",
      value: lowStockCount,
      icon: AlertTriangle,
      description: "Dikkat gerektiren ürünler",
      alert: true,
    },
    {
      title: "Kategoriler",
      value: categoriesData?.length || 0,
      icon: FolderTree,
      description: "Tanımlı kategoriler",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel</h1>
        <p className="text-muted-foreground">Mağazanızın genel görünümü</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon
                  className={`h-4 w-4 ${
                    stat.alert ? "text-destructive" : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/products/new"
              className="block p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">Yeni Ürün Ekle</div>
              <div className="text-sm text-muted-foreground">
                Kataloğa yeni bir ürün ekleyin
              </div>
            </a>
            <a
              href="/admin/categories/new"
              className="block p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">Kategori Ekle</div>
              <div className="text-sm text-muted-foreground">
                Yeni bir ürün kategorisi oluşturun
              </div>
            </a>
            <a
              href="/admin/settings"
              className="block p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">Ayarlar & WhatsApp</div>
              <div className="text-sm text-muted-foreground">
                Mağaza bilgileri ve ana sayfa slaytı
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Etkinlikler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gösterilecek son etkinlik yok
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

