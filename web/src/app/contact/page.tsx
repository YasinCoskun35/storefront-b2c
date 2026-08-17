import { Mail, MapPin, Phone } from "lucide-react";
import { LocationMap } from "@/components/contact/location-map";

const STORE_ADDRESS = "Seyhan, Aydın Hatboyu Cd. No:470 D:A, 35380 Buca/İzmir";
// Exact coordinates from the store's Google Maps listing
// (https://maps.app.goo.gl/bZ4WwhNKZTGoU4yd6) so the embed pins the real
// storefront instead of guessing from the address text.
const STORE_MAP_QUERY = "38.375269,27.143874";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "E-posta",
    lines: ["info@harunyapimarket.com", "destek@harunyapimarket.com"],
  },
  {
    icon: Phone,
    title: "Telefon",
    lines: ["0539 828 20 62", "Hafta içi: 09:00 - 18:00"],
  },
  {
    icon: MapPin,
    title: "Adres",
    lines: [STORE_ADDRESS],
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold">İletişim</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Ürünlerle ilgili sorularınız ve destek için bize ulaşın
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CONTACT_METHODS.map(({ icon: Icon, title, lines }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display font-semibold">{title}</h2>
              <div className="mt-2 space-y-0.5">
                {lines.map((line) => (
                  <p key={line} className="text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-center font-display text-xl font-semibold">
            Bizi Ziyaret Edin
          </h2>
          <LocationMap address={STORE_ADDRESS} query={STORE_MAP_QUERY} />
        </div>

        <div className="mt-12 rounded-xl border bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            Ürünlerimizi katalogdan inceleyebilir, sipariş öncesi
            aklınıza takılan her şeyi bize sorabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
