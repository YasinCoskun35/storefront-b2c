"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { catalogApi, CreateCategoryDto, Category } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface CategoryFormProps {
  categoryId?: string;
  initialData?: Category;
}

export function CategoryForm({ categoryId, initialData }: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [parentId, setParentId] = useState(initialData?.parentId || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder?.toString() || "0");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Fetch categories for parent dropdown (all levels, including inactive)
  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => catalogApi.getAllCategories({ includeInactive: true }),
  });

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug if it's empty or hasn't been manually edited
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  // Create or update category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      categoryId
        ? catalogApi.updateCategory(categoryId, data)
        : catalogApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: categoryId ? "Kategori güncellendi" : "Kategori oluşturuldu",
        description: categoryId
          ? "Kategori başarıyla güncellendi."
          : "Kategori başarıyla oluşturuldu.",
      });
      router.push("/admin/categories");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message ||
          (categoryId ? "Kategori güncellenemedi" : "Kategori oluşturulamadı"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name) {
      toast({
        title: "Doğrulama Hatası",
        description: "Lütfen bir kategori adı girin",
        variant: "destructive",
      });
      return;
    }

    const categoryData: CreateCategoryDto = {
      name,
      description: description || undefined,
      slug: slug || undefined,
      parentId: parentId || undefined,
      displayOrder: parseInt(displayOrder) || 0,
      isActive,
    };

    createCategoryMutation.mutate(categoryData);
  };

  const isLoading = createCategoryMutation.isPending;

  // Filter out current category and its descendants from parent options
  const availableParentCategories = categories?.filter(
    (cat) => cat.id !== categoryId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Bilgileri</CardTitle>
          <CardDescription>
            Temel kategori bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Kategori Adı *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="örn. Elektrikli El Aletleri"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Kısa Adı</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="örn. elektrikli-el-aletleri"
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakılırsa addan otomatik oluşturulur. Sadece küçük harf, rakam ve tire kullanın.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu kategoriyi tanımlayın"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle>Düzenleme</CardTitle>
          <CardDescription>
            Sıralama ve düzen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent">Üst Kategori</Label>
            <Select
              value={parentId || "none"}
              onValueChange={(v) => setParentId(v === "none" ? "" : v)}
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="Yok (Ana Seviye)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok (Ana Seviye)</SelectItem>
                {availableParentCategories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Alt kategori oluşturmak için bir üst kategori seçin
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Görüntülenme Sırası</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Küçük sayılar önce gösterilir (0 = ilk)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Aktif (müşterilere görünür)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {categoryId ? "Kategoriyi Güncelle" : "Kategori Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}



