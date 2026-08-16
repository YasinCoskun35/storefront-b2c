"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { catalogApi, CreateProductDto, ProductDetail } from "@/lib/api";
import { ENABLE_ORDERING } from "@/lib/config";
import { getImageUrl } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Loader2, Upload, X } from "lucide-react";

interface ProductFormProps {
  productId?: string;
  initialData?: ProductDetail;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice?.toString() || "");
  const [stockStatus, setStockStatus] = useState(initialData?.stockStatus || "InStock");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "0");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [weight, setWeight] = useState(initialData?.weight?.toString() || "");
  const [length, setLength] = useState(initialData?.length?.toString() || "");
  const [width, setWidth] = useState(initialData?.width?.toString() || "");
  const [height, setHeight] = useState(initialData?.height?.toString() || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    getImageUrl(initialData?.primaryImageUrl ?? initialData?.images?.[0]?.url) || ""
  );

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => catalogApi.getCategories(),
  });

  // Create or update product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductDto) =>
      productId
        ? catalogApi.updateProduct(productId, data)
        : catalogApi.createProduct(data),
    onSuccess: async (response) => {
      // Upload the new image if one was selected.
      if (imageFile) {
        try {
          await catalogApi.uploadProductImage(response.id, imageFile, true);
        } catch (error) {
          console.error("Failed to upload image:", error);
        }
      }

      toast({
        title: productId ? "Ürün güncellendi" : "Ürün oluşturuldu",
        description: productId
          ? "Ürün başarıyla güncellendi."
          : "Ürün başarıyla oluşturuldu.",
      });
      router.push("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message ||
          (productId ? "Ürün güncellenemedi" : "Ürün oluşturulamadı"),
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Price is only required when ordering/pricing is enabled.
    if (!name || !sku || !categoryId || (ENABLE_ORDERING && !price)) {
      toast({
        title: "Doğrulama Hatası",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    const productData: CreateProductDto = {
      name,
      sku,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      price: price ? parseFloat(price) : undefined,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      stockStatus,
      quantity: quantity ? parseInt(quantity) : 0,
      categoryId,
      weight: weight ? parseFloat(weight) : undefined,
      length: length ? parseFloat(length) : undefined,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      isActive,
      isFeatured,
    };

    createProductMutation.mutate(productData);
  };

  const isLoading = createProductMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>
            Ürünün temel bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn. Bosch GSB 18V Matkap"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">Stok Kodu *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="örn. BSH-18V-MTK"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Kısa Açıklama</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Kısa ürün özeti"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detaylı Açıklama</Label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyat ve Stok</CardTitle>
          <CardDescription>
            {ENABLE_ORDERING
              ? "Fiyat belirleyin ve stoğu yönetin"
              : "Sipariş kapalı olduğu için fiyat ve adet zorunlu değildir"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">
                Fiyat {ENABLE_ORDERING ? "*" : "(isteğe bağlı)"}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required={ENABLE_ORDERING}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">İndirim Öncesi Fiyat</Label>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stockStatus">
                Stok Durumu {ENABLE_ORDERING ? "*" : ""}
              </Label>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger id="stockStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="InStock">Stokta</SelectItem>
                  <SelectItem value="LowStock">Son Ürünler</SelectItem>
                  <SelectItem value="OutOfStock">Tükendi</SelectItem>
                  <SelectItem value="Discontinued">Satıştan Kalktı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Adet {ENABLE_ORDERING ? "*" : ""}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required={ENABLE_ORDERING}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle>Düzenleme</CardTitle>
          <CardDescription>
            Ürününüzü kategorilere ayırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Bir kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Aktif
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Öne Çıkan Ürün
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Kargo Bilgileri</CardTitle>
          <CardDescription>
            Ürün boyutları ve ağırlığı
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Ağırlık (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="length">Uzunluk (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Genişlik (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Yükseklik (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Görseli</CardTitle>
          <CardDescription>
            Ana ürün görselini yükleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Ürün önizleme"
                className="h-48 w-48 rounded-lg border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Yüklemek için tıklayın</span> veya sürükleyip bırakın
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG veya WEBP (EN FAZLA 5MB)
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {productId ? "Ürünü Güncelle" : "Ürün Oluştur"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}



