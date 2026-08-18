import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/* Carte d'indicateur, reprise de public/maquette.png :
   label en majuscules, pastille d'icone teintee, grande valeur, variation. */
export function StatCard({
  label,
  valeur,
  icone,
  variation,
  precision,
  teinte = "brand",
}: {
  label: string;
  valeur: string;
  icone: React.ReactNode;
  /** Variation en % par rapport au mois precedent. null = pas de reference. */
  variation?: number | null;
  /** Texte secondaire, affiche quand il n'y a pas de variation. */
  precision?: string;
  teinte?: "brand" | "success" | "warning" | "info";
}) {
  const teintes = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  } as const;

  const hausse = typeof variation === "number" && variation >= 0;

  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {label}
          </p>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-control",
              teintes[teinte],
            )}
            aria-hidden="true"
          >
            {icone}
          </span>
        </div>

        <p className="mt-3 text-3xl font-bold text-ink tabular-nums">{valeur}</p>

        {typeof variation === "number" ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-sm",
              hausse ? "text-success" : "text-danger",
            )}
          >
            {hausse ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownRight className="size-4" />
            )}
            {hausse ? "+" : ""}
            {variation} % vs mois dernier
          </p>
        ) : (
          precision && <p className="mt-1 text-sm text-muted">{precision}</p>
        )}
      </CardBody>
    </Card>
  );
}
