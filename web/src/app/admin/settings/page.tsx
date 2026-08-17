"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { settingsApi, type SliderSlide, type StoreSettings } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { SlideLinkPicker } from "@/components/admin/slide-link-picker";

const EMPTY_SETTINGS: StoreSettings = {
  storeName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  whatsAppNumber: "",
  whatsAppMessage: "",
  instagramUrl: "",
  facebookUrl: "",
  logoUrl: "",
  slides: [],
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => setSettings({ ...EMPTY_SETTINGS, ...data, slides: data.slides ?? [] }))
      .catch(() => toast({ title: "Ayarlar yüklenemedi", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const setField = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const updateSlide = (index: number, patch: Partial<SliderSlide>) =>
    setSettings((prev) => ({
      ...prev,
      slides: prev.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addSlide = () =>
    setSettings((prev) => ({ ...prev, slides: [...prev.slides, { imageUrl: "" }] }));

  const removeSlide = (index: number) =>
    setSettings((prev) => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }));

  const moveSlide = (index: number, dir: -1 | 1) =>
    setSettings((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.slides.length) return prev;
      const slides = [...prev.slides];
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...prev, slides };
    });

  const handleSave = async () => {
    // Drop slides without an image before saving.
    const cleaned: StoreSettings = {
      ...settings,
      slides: settings.slides.filter((s) => s.imageUrl.trim().length > 0),
    };
    setIsSaving(true);
    try {
      const saved = await settingsApi.update(cleaned);
      setSettings({ ...EMPTY_SETTINGS, ...saved, slides: saved.slides ?? [] });
      toast({ title: "Ayarlar kaydedildi", description: "Mağaza ayarlarınız güncellendi." });
    } catch {
      toast({ title: "Kaydedilemedi", description: "Ayarlar kaydedilemedi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Ayarlar yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-secondary">Ayarlar</h1>
          <p className="text-muted-foreground">Mağaza bilgilerinizi, WhatsApp ve ana sayfa slaytını yönetin</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>Mağaza Bilgileri</CardTitle>
          <CardDescription>Mağaza genelinde ve alt bilgide gösterilir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Mağaza Adı">
            <Input value={settings.storeName} onChange={(e) => setField("storeName", e.target.value)} />
          </Field>
          <Field label="İletişim E-postası">
            <Input type="email" value={settings.contactEmail ?? ""} onChange={(e) => setField("contactEmail", e.target.value)} />
          </Field>
          <Field label="İletişim Telefonu">
            <Input value={settings.contactPhone ?? ""} onChange={(e) => setField("contactPhone", e.target.value)} />
          </Field>
          <Field label="Adres">
            <Input value={settings.address ?? ""} onChange={(e) => setField("address", e.target.value)} />
          </Field>
          <Field label="Instagram Bağlantısı">
            <Input value={settings.instagramUrl ?? ""} onChange={(e) => setField("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="Facebook Bağlantısı">
            <Input value={settings.facebookUrl ?? ""} onChange={(e) => setField("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
          </Field>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>
            Yüzen sohbet düğmesini ve ürün sorularını çalıştırır. Numarayı uluslararası
            biçimde girin (ülke kodu + numara), örn. <code>905551112233</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp Numarası">
            <Input value={settings.whatsAppNumber ?? ""} onChange={(e) => setField("whatsAppNumber", e.target.value)} placeholder="905551112233" />
          </Field>
          <Field label="Varsayılan Mesaj (isteğe bağlı)">
            <Input value={settings.whatsAppMessage ?? ""} onChange={(e) => setField("whatsAppMessage", e.target.value)} placeholder="Merhaba! Şunu sormak istiyorum..." />
          </Field>
        </CardContent>
      </Card>

      {/* Slider */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ana Sayfa Slaytı</CardTitle>
              <CardDescription>Ana sayfanın üstünde gösterilen görseller. Boş bırakırsanız varsayılan görsel kullanılır.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSlide}>
              <Plus className="mr-1.5 h-4 w-4" /> Slayt Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.slides.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz slayt yok. Slayt oluşturmak için birini ekleyin.</p>
          )}
          {settings.slides.map((slide, i) => (
            <SlideEditor
              key={i}
              index={i}
              slide={slide}
              total={settings.slides.length}
              onChange={(patch) => updateSlide(i, patch)}
              onRemove={() => removeSlide(i)}
              onMove={(dir) => moveSlide(i, dir)}
              onUploadError={() => toast({ title: "Yükleme başarısız", variant: "destructive" })}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SlideEditor({
  index,
  slide,
  total,
  onChange,
  onRemove,
  onMove,
  onUploadError,
}: {
  index: number;
  slide: SliderSlide;
  total: number;
  onChange: (patch: Partial<SliderSlide>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onUploadError: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const preview = getImageUrl(slide.imageUrl);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await settingsApi.uploadImage(file);
      onChange({ imageUrl: url });
    } catch {
      onUploadError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Slayt {index + 1}</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted">
            {preview ? (
              <Image src={preview} alt={slide.headline || `Slayt ${index + 1}`} fill className="object-cover" sizes="200px" />
            ) : (
              <span className="text-xs text-muted-foreground">Görsel yok</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
            {uploading ? "Yükleniyor..." : "Görsel yükle"}
          </Button>
        </div>

        <div className="space-y-3">
          <Field label="Başlık">
            <Input value={slide.headline ?? ""} onChange={(e) => onChange({ headline: e.target.value })} placeholder="Büyük sezon indirimi" />
          </Field>
          <Field label="Alt Metin">
            <Textarea rows={2} value={slide.subtext ?? ""} onChange={(e) => onChange({ subtext: e.target.value })} placeholder="Kısa açıklama satırı" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Düğme Metni">
              <Input value={slide.ctaLabel ?? ""} onChange={(e) => onChange({ ctaLabel: e.target.value })} placeholder="Alışverişe başla" />
            </Field>
            <Field label="Düğme Bağlantısı">
              <Input value={slide.ctaLink ?? ""} onChange={(e) => onChange({ ctaLink: e.target.value })} placeholder="/products" />
            </Field>
          </div>
          <SlideLinkPicker onSelect={(link) => onChange({ ctaLink: link })} />
        </div>
      </div>
    </div>
  );
}
