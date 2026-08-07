import { Mail, MapPin, Phone } from "lucide-react";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email",
    lines: ["info@storefront.com", "support@storefront.com"],
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+90 555 000 0000", "Mon-Fri: 9AM - 6PM"],
  },
  {
    icon: MapPin,
    title: "Address",
    lines: ["Istanbul, Turkey"],
  },
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get in touch with us for product inquiries and support
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

        <div className="mt-12 rounded-xl border bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            For product purchases, please browse our catalog and check out
            online, or reach out with any questions before you order.
          </p>
        </div>
      </div>
    </div>
  );
}
