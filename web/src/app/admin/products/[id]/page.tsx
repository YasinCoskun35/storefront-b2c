"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "@/components/admin/product-form";
import { catalogApi } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => catalogApi.getProductById(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary">Ürün Bulunamadı</h1>
            <p className="text-muted-foreground">Aradığınız ürün mevcut değil.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Ürünü Düzenle</h1>
          <p className="text-muted-foreground">Ürün bilgilerini güncelleyin</p>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm productId={id} initialData={product} />
    </div>
  );
}



