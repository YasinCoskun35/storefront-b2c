import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StockStatus = "InStock" | "LowStock" | "OutOfStock" | "Discontinued" | "PreOrder" | string;

const stockConfig: Record<string, { label: string; className: string }> = {
  InStock: {
    label: "Stokta",
    className: "border-transparent bg-success text-success-foreground hover:bg-success/90",
  },
  LowStock: {
    label: "Son Ürünler",
    className: "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
  },
  OutOfStock: {
    label: "Tükendi",
    className: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  Discontinued: {
    label: "Satıştan Kalktı",
    className: "border-transparent bg-muted text-muted-foreground",
  },
  PreOrder: {
    label: "Ön Sipariş",
    className: "border-transparent bg-accent text-accent-foreground hover:bg-accent/90",
  },
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const config = stockConfig[status] ?? stockConfig.InStock;

  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
}
