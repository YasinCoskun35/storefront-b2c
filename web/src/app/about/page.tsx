import Link from "next/link";
import { ArrowRight, HeartHandshake, PackageCheck, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const OFFERINGS = [
  {
    icon: Wrench,
    title: "Extensive Selection",
    description: "Power and hand tools for professionals and DIY enthusiasts alike.",
  },
  {
    icon: PackageCheck,
    title: "Quality Hardware",
    description: "Building materials and hardware you can rely on for every project.",
  },
  {
    icon: HeartHandshake,
    title: "Expert Support",
    description: "Advice and customer support to help you get the job done right.",
  },
  {
    icon: ShieldCheck,
    title: "Competitive Pricing",
    description: "Fair, transparent pricing with no surprises at checkout.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="border-b bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">About Storefront</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-secondary-foreground/70">
            Your trusted hardware store for quality tools and equipment, serving
            professionals and DIY enthusiasts.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold">Our Mission</h2>
          <p className="mt-4 text-muted-foreground">
            To provide high-quality hardware products and exceptional service to
            our customers, helping them complete their projects successfully.
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
          <h2 className="font-display text-2xl font-bold">Ready to get started?</h2>
          <p className="max-w-xl text-muted-foreground">
            Browse our online catalog and check out securely, or reach out if you
            have any questions about a product.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/products">
              <Button size="lg">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
