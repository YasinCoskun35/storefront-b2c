"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { catalogApi } from "@/lib/api";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: true }),
  });

  const category = categories?.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-secondary">Kategori Bulunamadı</h1>
            <p className="text-muted-foreground">Aradığınız kategori mevcut değil.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Kategoriyi Düzenle</h1>
          <p className="text-muted-foreground">Kategori bilgilerini güncelleyin</p>
        </div>
      </div>

      <CategoryForm categoryId={id} initialData={category} />
    </div>
  );
}
