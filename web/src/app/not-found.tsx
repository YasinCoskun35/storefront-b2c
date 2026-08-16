import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Compass className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-primary">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Sayfa bulunamadı</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <Button size="lg">Ana Sayfaya Dön</Button>
        </Link>
        <Link href="/products">
          <Button size="lg" variant="outline">
            Ürünleri İncele
          </Button>
        </Link>
      </div>
    </div>
  );
}
