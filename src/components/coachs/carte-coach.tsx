import Link from "next/link";
import { Archive, Pencil, Phone, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formaterTelephone } from "@/lib/utils/telephone";
import { actionBasculerArchivageCoach } from "@/lib/actions/coach";
import { cn } from "@/lib/utils/cn";

type Coach = {
  id: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  specialite: string | null;
  photoUrl: string | null;
  actif: boolean;
  _count: { sessionsCours: number };
};

export function CarteCoach({ coach }: { coach: Coach }) {
  const nomComplet = `${coach.prenom} ${coach.nom}`;
  const seances = coach._count.sessionsCours;

  return (
    <Card className={cn(!coach.actif && "border-dashed bg-canvas")}>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nom={nomComplet} photoUrl={coach.photoUrl} taille="lg" />
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold",
                  coach.actif ? "text-ink" : "text-muted",
                )}
              >
                {nomComplet}
              </h3>
              {coach.specialite && (
                <p className="mt-0.5 truncate text-sm text-muted">
                  {coach.specialite}
                </p>
              )}
            </div>
          </div>
          {!coach.actif && <Badge ton="neutre">Archive</Badge>}
        </div>

        {coach.telephone && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Phone className="size-4" />
            {formaterTelephone(coach.telephone)}
          </p>
        )}

        <p className="mt-2 text-xs text-muted">
          {seances === 0
            ? "Aucune seance animee"
            : `${seances} seance${seances > 1 ? "s" : ""} animee${seances > 1 ? "s" : ""}`}
        </p>

        <div className="mt-4 flex gap-2 border-t border-line pt-4">
          <Link href={`/cours/coachs/${coach.id}/modifier`} className="flex-1">
            <Button variante="contour" taille="sm" className="w-full">
              <Pencil className="size-4" />
              Modifier
            </Button>
          </Link>

          {/* Aucun bouton "Supprimer" : un coach s'archive (§9). */}
          <form action={actionBasculerArchivageCoach} className="flex-1">
            <input type="hidden" name="id" value={coach.id} />
            <input
              type="hidden"
              name="actif"
              value={coach.actif ? "false" : "true"}
            />
            <Button
              type="submit"
              variante={coach.actif ? "fantome" : "contour"}
              taille="sm"
              className="w-full"
            >
              {coach.actif ? (
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
