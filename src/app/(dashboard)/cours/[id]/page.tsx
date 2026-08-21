import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Clock,
  Pencil,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { BoutonAnnulerSession } from "@/components/cours/bouton-annuler-session";
import { trouverSessionCours } from "@/lib/data/session-cours";
import { listerReservationsSession } from "@/lib/data/reservation";
import { actionAnnulerReservation } from "@/lib/actions/reservation";
import { parametresSalle } from "@/lib/data/gym";
import { formatDateLongue, formatHeure } from "@/lib/utils/format";
import { lienWhatsApp, messageRappelSeance } from "@/lib/utils/whatsapp";

export const metadata = { title: "Seance — Fitt" };

export default async function PageSession({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, gym] = await Promise.all([
    trouverSessionCours(id),
    parametresSalle(),
  ]);
  if (!session) notFound();

  const reservations = await listerReservationsSession(id);
  const complet = session.placesReservees >= session.capacite;
  const planifiee = session.statut === "PLANIFIEE";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/cours"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour au planning
      </Link>

      <PageHeader
        titre={session.typeCours.nom}
        sousTitre={`${formatDateLongue(session.debutLe)} a ${formatHeure(session.debutLe)}`}
        action={
          planifiee && (
            <div className="flex gap-2">
              <Link href={`/cours/${session.id}/modifier`}>
                <Button variante="contour" taille="sm">
                  <Pencil className="size-4" />
                  Modifier
                </Button>
              </Link>
              <BoutonAnnulerSession
                sessionCoursId={session.id}
                nomTypeCours={session.typeCours.nom}
              />
            </div>
          )
        }
      />

      {session.statut === "ANNULEE" && (
        <div className="rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <p className="font-medium">
            Seance annulee
            {session.annuleLe && ` le ${formatDateLongue(session.annuleLe)}`}
          </p>
          {session.motifAnnul && <p className="mt-0.5">{session.motifAnnul}</p>}
        </div>
      )}

      <Card>
        <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 text-sm text-muted">
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: session.typeCours.couleur ?? "#FF6B35" }}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: session.typeCours.couleur ?? "#FF6B35" }}
              aria-hidden="true"
            />
            <span className="font-medium text-ink">
              {session.coach.prenom} {session.coach.nom}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" />
            {session.dureeMinutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {session.placesReservees}/{session.capacite} places
          </span>
          {planifiee && complet && <Badge ton="alerte">Complet</Badge>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          titre={`Inscrits (${reservations.length})`}
          icone={<Users className="size-4 text-brand" />}
          action={
            planifiee &&
            !complet && (
              <Link href={`/cours/${session.id}/inscrire`}>
                <Button taille="sm">
                  <UserPlus className="size-4" />
                  Inscrire
                </Button>
              </Link>
            )
          }
        />
        <CardBody>
          {reservations.length === 0 ? (
            <EmptyState
              icone={<UserPlus className="size-5" />}
              titre="Aucun inscrit"
              description={
                planifiee
                  ? "Inscrivez un adherent pour lui reserver une place sur cette seance."
                  : "Cette seance est annulee."
              }
              action={
                planifiee && (
                  <Link href={`/cours/${session.id}/inscrire`}>
                    <Button>
                      <UserPlus className="size-4" />
                      Inscrire un adherent
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {reservations.map((r) => {
                const nomComplet = `${r.adherent.prenom} ${r.adherent.nom}`;
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar
                      nom={nomComplet}
                      photoUrl={r.adherent.photoUrl}
                      taille="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {nomComplet}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {r.adherent.numero}
                      </p>
                    </div>
                    {planifiee && (
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <a
                          href={lienWhatsApp(
                            r.adherent.telephone,
                            messageRappelSeance(
                              r.adherent.prenom,
                              session.typeCours.nom,
                              gym.nom,
                              session.debutLe,
                            ),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variante="whatsapp" taille="sm">
                            <Send className="size-4" />
                            Rappel
                          </Button>
                        </a>
                        <form action={actionAnnulerReservation}>
                          <input type="hidden" name="id" value={r.id} />
                          <input
                            type="hidden"
                            name="sessionCoursId"
                            value={session.id}
                          />
                          <Button
                            type="submit"
                            variante="fantome"
                            taille="sm"
                            aria-label={`Desinscrire ${nomComplet}`}
                          >
                            <X className="size-4" />
                            Retirer
                          </Button>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
