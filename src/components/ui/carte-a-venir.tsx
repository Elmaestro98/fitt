import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/**
 * Emplacement annonce pour une fonctionnalite d'un lot ulterieur.
 *
 * On dessine la place que prendra la carte, sans jamais y mettre de fausses
 * donnees : un faux montant ou un faux graphe finit toujours par etre pris
 * pour un vrai, et fait perdre une heure a quelqu'un.
 */
export function CarteAVenir({
  titre,
  lot,
  description,
  hauteur = "h-40",
  className,
}: {
  titre: string;
  lot: number;
  description: string;
  hauteur?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed", className)}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-muted">
          <Lock className="size-4" />
          {titre}
        </h2>
        <span className="rounded-pill bg-sunken px-2.5 py-1 text-xs font-medium text-muted">
          Lot {lot}
        </span>
      </div>
      <div
        className={cn(
          "mx-5 mb-5 flex items-center justify-center rounded-control bg-sunken px-6 text-center",
          hauteur,
        )}
      >
        <p className="max-w-xs text-sm text-muted">{description}</p>
      </div>
    </Card>
  );
}
