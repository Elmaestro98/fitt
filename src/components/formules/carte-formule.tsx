import Link from "next/link";
import { Archive, Pencil, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils/format";
import { formaterDuree, type UniteDuree } from "@/lib/utils/duree";
import { actionBasculerArchivage } from "@/lib/actions/formule";
import { cn } from "@/lib/utils/cn";

type Formule = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  dureeValeur: number;
  dureeUnite: string;
  actif: boolean;
  _count: { abonnements: number };
};

export function CarteFormule({ formule }: { formule: Formule }) {
  const souscriptions = formule._count.abonnements;

  return (
    <Card className={cn(!formule.actif && "border-dashed bg-canvas")}>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-semibold",
                formule.actif ? "text-ink" : "text-muted",
              )}
            >
              {formule.nom}
            </h3>
            {formule.description && (
              <p className="mt-0.5 text-sm text-muted">{formule.description}</p>
            )}
          </div>
          {!formule.actif && <Badge ton="neutre">Archivee</Badge>}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-bold",
              formule.actif ? "text-ink" : "text-muted",
            )}
          >
            {formatFCFA(formule.prix)}
          </span>
          <span className="text-sm text-muted">
            / {formaterDuree(formule.dureeValeur, formule.dureeUnite as UniteDuree)}
          </span>
        </div>

        <p className="mt-2 text-xs text-muted">
          {souscriptions === 0
            ? "Jamais souscrite"
            : `${souscriptions} abonnement${souscriptions > 1 ? "s" : ""} souscrit${souscriptions > 1 ? "s" : ""}`}
        </p>

        <div className="mt-4 flex gap-2 border-t border-line pt-4">
          <Link href={`/formules/${formule.id}/modifier`} className="flex-1">
            <Button variante="contour" taille="sm" className="w-full">
              <Pencil className="size-4" />
              Modifier
            </Button>
          </Link>

          {/* Aucun bouton "Supprimer" : une formule s'archive (§9). */}
          <form action={actionBasculerArchivage} className="flex-1">
            <input type="hidden" name="id" value={formule.id} />
            <input
              type="hidden"
              name="actif"
              value={formule.actif ? "false" : "true"}
            />
            <Button
              type="submit"
              variante={formule.actif ? "fantome" : "contour"}
              taille="sm"
              className="w-full"
            >
              {formule.actif ? (
                <>
                  <Archive className="size-4" />
                  Archiver
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Reactiver
                </>
              )}
            </Button>
          </form>
        </div>
      </CardBody>
    </Card>
  );
}
