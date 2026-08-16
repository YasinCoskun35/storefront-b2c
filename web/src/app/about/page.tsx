import Link from "next/link";
import { ArrowRight, HeartHandshake, PackageCheck, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const OFFERINGS = [
  {
    icon: Wrench,
    title: "Geniş Ürün Yelpazesi",
    description: "Profesyoneller ve kendin-yap meraklıları için elektrikli ve el aletleri.",
  },
  {
    icon: PackageCheck,
    title: "Kaliteli Hırdavat",
    description: "Her projede güvenebileceğiniz yapı malzemeleri ve hırdavat.",
  },
  {
    icon: HeartHandshake,
    title: "Uzman Desteği",
    description: "İşinizi doğru yapmanız için tavsiye ve müşteri desteği.",
  },
  {
    icon: ShieldCheck,
    title: "Uygun Fiyatlar",
    description: "Adil, şeffaf fiyatlandırma; sürpriz yok.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="border-b bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">Hakkımızda</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary-foreground/70">
            Profesyonellere ve kendin-yap meraklılarına hizmet veren, kaliteli
            ürünlerin güvenilir adresi.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold">Misyonumuz</h2>
          <p className="mt-4 text-muted-foreground">
            Müşterilerimize yüksek kaliteli ürünler ve üstün hizmet sunarak
            projelerini başarıyla tamamlamalarına yardımcı olmak.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OFFERINGS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center">
          <h2 className="font-display text-2xl font-bold">Başlamaya hazır mısınız?</h2>
          <p className="max-w-xl text-muted-foreground">
            Kataloğumuzu inceleyin ya da bir ürün hakkında sorunuz varsa
            bize ulaşın.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/products">
              <Button size="lg">
                Ürünleri İncele
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                İletişim
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
