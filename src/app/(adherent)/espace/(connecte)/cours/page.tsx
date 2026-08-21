// Les cours a venir de l'adherent (Lot 4).
//
// Aucune reservation en libre-service ici : c'est le staff qui inscrit
// l'adherent depuis le back-office (decision du 20/08/2026). Cette page ne
// fait que lui montrer ce a quoi il est deja inscrit — sinon il ne le
// saurait que si on le lui dit de vive voix.
import { Dumbbell } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { mesCoursEspace } from "@/lib/data/espace";
import { formatDateLongue, formatHeure } from "@/lib/utils/format";

export const metadata = { title: "Mes cours — Fitt" };

export default async function PageMesCours() {
  const reservations = await mesCoursEspace();

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Mes cours"
        sousTitre="Les seances auxquelles vous etes inscrit(e)"
      />

      {reservations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<Dumbbell className="size-6" />}
              titre="Aucun cours a venir"
              description="Quand la salle vous inscrit a une seance, elle apparait ici."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {reservations.map(({ id, sessionCours: s }) => (
            <Card key={id}>
              <CardBody className="flex items-center gap-4 py-4">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.typeCours.couleur ?? "#FF6B35" }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {s.typeCours.nom}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {s.coach.prenom} {s.coach.nom} · {s.dureeMinutes} min
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-ink">
                    {formatDateLongue(s.debutLe)}
                  </p>
                  <p className="text-xs text-muted">{formatHeure(s.debutLe)}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
