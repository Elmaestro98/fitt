import Link from "next/link";
import { Archive, Pencil, RotateCcw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { actionBasculerArchivageTypeCours } from "@/lib/actions/type-cours";
import { cn } from "@/lib/utils/cn";

type TypeCours = {
  id: string;
  nom: string;
  description: string | null;
  couleur: string | null;
  dureeMinutes: number;
  capaciteDefaut: number;
  actif: boolean;
  _count: { sessions: number };
};

export function CarteTypeCours({ typeCours }: { typeCours: TypeCours }) {
  const seances = typeCours._count.sessions;

  return (
    <Card className={cn(!typeCours.actif && "border-dashed bg-canvas")}>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: typeCours.couleur ?? "#FF6B35" }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold",
                  typeCours.actif ? "text-ink" : "text-muted",
                )}
              >
                {typeCours.nom}
              </h3>
              {typeCours.description && (
                <p className="mt-0.5 truncate text-sm text-muted">
                  {typeCours.description}
                </p>
              )}
            </div>
          </div>
          {!typeCours.actif && <Badge ton="neutre">Archive</Badge>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>{typeCours.dureeMinutes} min</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {typeCours.capaciteDefaut} places par defaut
          </span>
        </div>

        <p className="mt-2 text-xs text-muted">
          {seances === 0
            ? "Jamais programme"
            : `${seances} seance${seances > 1 ? "s" : ""} programmee${seances > 1 ? "s" : ""}`}
        </p>

        <div className="mt-4 flex gap-2 border-t border-line pt-4">
          <Link
            href={`/cours/types-cours/${typeCours.id}/modifier`}
            className="flex-1"
          >
            <Button variante="contour" taille="sm" className="w-full">
              <Pencil className="size-4" />
              Modifier
            </Button>
          </Link>

          {/* Aucun bouton "Supprimer" : un type de cours s'archive (§9). */}
          <form action={actionBasculerArchivageTypeCours} className="flex-1">
            <input type="hidden" name="id" value={typeCours.id} />
            <input
              type="hidden"
              name="actif"
              value={typeCours.actif ? "false" : "true"}
            />
            <Button
              type="submit"
              variante={typeCours.actif ? "fantome" : "contour"}
              taille="sm"
              className="w-full"
            >
              {typeCours.actif ? (
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
