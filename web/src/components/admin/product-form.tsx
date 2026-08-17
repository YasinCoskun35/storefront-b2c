"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { catalogApi, CreateProductDto, ProductDetail, ProductImage as ProductImageDto } from "@/lib/api";
import { ENABLE_ORDERING } from "@/lib/config";
import { getImageUrl } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Loader2, Star, Trash2, Upload, X } from "lucide-react";

interface ProductFormProps {
  productId?: string;
  initialData?: ProductDetail;
}

interface PendingImage {
  file: File;
  previewUrl: string;
}

// Each uploaded photo produces one row per variant (Original/Medium/Large/
// Thumbnail); pick a single preferred variant type so the gallery shows one
// tile per distinct photo. Mirrors product-gallery.tsx's selectGalleryImages.
function groupProductImages(images: ProductImageDto[]): ProductImageDto[] {
  const preferenceOrder = ["Large", "Original", "Medium", "Thumbnail"];

  for (const type of preferenceOrder) {
    const matches = images.filter((img) => img.type === type);
    if (matches.length > 0) {
      return [...matches].sort((a, b) => a.displayOrder - b.displayOrder);
    }
  }

  return images;
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const [existingImages, setExistingImages] = useState<ProductImageDto[]>(
    groupProductImages(initialData?.images || [])
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);

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
      // Upload any photos that were selected before the product existed.
      for (let i = 0; i < pendingImages.length; i++) {
        try {
          await catalogApi.uploadProductImage(response.id, pendingImages[i].file, i === 0);
        } catch (error) {
          console.error("Failed to upload image:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
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

  const refreshImages = async () => {
    if (!productId) return;
    const fresh = await catalogApi.getProductById(productId);
    setExistingImages(groupProductImages(fresh.images));
    queryClient.invalidateQueries({ queryKey: ["product", productId] });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPendingImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadPendingImages = async () => {
    if (!productId || pendingImages.length === 0) return;

    setIsUploadingImages(true);
    try {
      for (let i = 0; i < pendingImages.length; i++) {
        const isPrimary = existingImages.length === 0 && i === 0;
        await catalogApi.uploadProductImage(productId, pendingImages[i].file, isPrimary);
      }

      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages([]);

      toast({
        title: "Fotoğraflar yükleniyor",
        description: "İşlenip birkaç saniye içinde galeride görünecek.",
      });

      // Processing happens in the background, so give it a moment before refetching.
      setTimeout(refreshImages, 2500);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Fotoğraflar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!productId) return;
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;

    try {
      await catalogApi.deleteProductImage(productId, imageId);
      await refreshImages();
      toast({ title: "Fotoğraf silindi" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Fotoğraf silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!productId) return;

    try {
      await catalogApi.setPrimaryProductImage(productId, imageId);
      await refreshImages();
      toast({ title: "Birincil fotoğraf güncellendi" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Birincil fotoğraf ayarlanamadı",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Price is only required when ordering/pricing is enabled.
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = "Ürün adı zorunludur";
    if (!sku) newErrors.sku = "Stok kodu zorunludur";
    if (!categoryId) newErrors.categoryId = "Kategori seçimi zorunludur";
    if (ENABLE_ORDERING && !price) newErrors.price = "Fiyat zorunludur";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name) {
        nameRef.current?.focus();
      } else if (newErrors.sku) {
        skuRef.current?.focus();
      } else if (newErrors.categoryId) {
        categoryTriggerRef.current?.focus();
      } else if (newErrors.price) {
        priceRef.current?.focus();
      }

      toast({
        title: "Doğrulama Hatası",
        description: "Lütfen kırmızı ile işaretlenen zorunlu alanları doldurun",
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
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="örn. Bosch GSB 18V Matkap"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">Stok Kodu *</Label>
              <Input
                id="sku"
                ref={skuRef}
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
                }}
                placeholder="örn. BSH-18V-MTK"
                className={errors.sku ? "border-destructive focus-visible:ring-destructive" : undefined}
                aria-invalid={!!errors.sku}
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
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
                ref={priceRef}
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="0.00"
                className={errors.price ? "border-destructive focus-visible:ring-destructive" : undefined}
                aria-invalid={!!errors.price}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
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
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: "" }));
              }}
            >
              <SelectTrigger
                id="category"
                ref={categoryTriggerRef}
                className={errors.categoryId ? "border-destructive focus:ring-destructive" : undefined}
                aria-invalid={!!errors.categoryId}
              >
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
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
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

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Görselleri</CardTitle>
          <CardDescription>
            Birden fazla fotoğraf ekleyebilirsiniz. Yıldıza tıklayarak birincil fotoğrafı belirleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(existingImages.length > 0 || pendingImages.length > 0) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={getImageUrl(img.url) || ""}
                    alt="Ürün görseli"
                    className={`h-32 w-full rounded-lg border-2 object-cover ${
                      img.isPrimary ? "border-primary" : "border-transparent"
                    }`}
                  />
                  {img.isPrimary && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Birincil
                    </span>
                  )}
                  <div className="absolute right-1 top-1 flex gap-1">
                    {!img.isPrimary && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        title="Birincil yap"
                        onClick={() => handleSetPrimaryImage(img.id)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      title="Sil"
                      onClick={() => handleDeleteExistingImage(img.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {pendingImages.map((img, index) => (
                <div key={img.previewUrl} className="relative">
                  <img
                    src={img.previewUrl}
                    alt="Yeni fotoğraf önizleme"
                    className="h-32 w-full rounded-lg border-2 border-dashed border-muted-foreground/40 object-cover opacity-80"
                  />
                  <span className="absolute left-1 top-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {productId ? "Bekliyor" : "Yeni"}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    title="Kaldır"
                    onClick={() => handleRemovePendingImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"
            >
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  <span className="font-semibold">Yüklemek için tıklayın</span> veya sürükleyip bırakın
                </p>
                <p className="text-xs text-muted-foreground">
                  Birden fazla dosya seçebilirsiniz. PNG, JPG veya WEBP (EN FAZLA 5MB)
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
              />
            </label>
          </div>

          {productId && pendingImages.length > 0 && (
            <Button
              type="button"
              onClick={handleUploadPendingImages}
              disabled={isUploadingImages}
            >
              {isUploadingImages && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingImages.length} Fotoğrafı Yükle
            </Button>
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



