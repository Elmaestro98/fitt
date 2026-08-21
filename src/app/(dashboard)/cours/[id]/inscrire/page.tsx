import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft, Search, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlerteFormulaire } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { BarreRechercheAdherent } from "@/components/cours/barre-recherche-adherent";
import { trouverSessionCours } from "@/lib/data/session-cours";
import { listerAdherents } from "@/lib/data/adherent";
import { actionReserverPlace } from "@/lib/actions/reservation";

export const metadata = { title: "Inscrire un adherent — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PageInscrireSession({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Params>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const session = await trouverSessionCours(id);
  if (!session) notFound();

  const recherche = typeof sp.recherche === "string" ? sp.recherche : undefined;
  const erreur = typeof sp.erreur === "string" ? sp.erreur : undefined;

  // Seance annulee ou deja complete : on ne propose plus d'inscrire, on
  // renvoie a la fiche (elle-meme n'affiche plus le bouton "Inscrire" dans
  // ces cas-la).
  if (session.statut !== "PLANIFIEE" || session.placesReservees >= session.capacite) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <PageHeader
          titre={
            session.statut !== "PLANIFIEE" ? "Seance annulee" : "Seance complete"
          }
        />
        <Card>
          <EmptyState
            titre={
              session.statut !== "PLANIFIEE"
                ? "Cette seance n'est plus ouverte"
                : "Plus de place disponible"
            }
            description={
              session.statut !== "PLANIFIEE"
                ? "Cette seance a ete annulee."
                : "Cette seance a atteint sa capacite maximale."
            }
            action={
              <Link href={`/cours/${session.id}`}>
                <Button variante="contour">Retour a la seance</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  // On ne propose que les adherents ACTIFS : une seance de cours est un
  // service reserve aux membres a jour, pas aux fiches expirees ou archivees.
  const { adherents } = recherche
    ? await listerAdherents({ recherche, statut: "ACTIF" })
    : { adherents: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/cours/${session.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la seance
      </Link>

      <PageHeader
        titre="Inscrire un adherent"
        sousTitre={`${session.typeCours.nom} — ${session.placesReservees}/${session.capacite} places`}
      />

      {erreur && <AlerteFormulaire>{erreur}</AlerteFormulaire>}

      <Suspense fallback={<div className="h-11" />}>
        <BarreRechercheAdherent basePath={`/cours/${session.id}/inscrire`} />
      </Suspense>

      <Card className="overflow-hidden">
        {!recherche ? (
          <EmptyState
            icone={<Search className="size-5" />}
            titre="Recherchez un adherent"
            description="Tapez un nom, un numero ou un telephone pour trouver un adherent actif."
          />
        ) : adherents.length === 0 ? (
          <EmptyState
            icone={<Search className="size-5" />}
            titre="Aucun resultat"
            description="Aucun adherent actif ne correspond a cette recherche."
          />
        ) : (
          <ul className="divide-y divide-line">
            {adherents.map((a) => {
              const nomComplet = `${a.prenom} ${a.nom}`;
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar nom={nomComplet} photoUrl={a.photoUrl} taille="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {nomComplet}
                    </p>
                    <p className="truncate text-xs text-muted">{a.numero}</p>
                  </div>
                  <form action={actionReserverPlace}>
                    <input
                      type="hidden"
                      name="sessionCoursId"
                      value={session.id}
                    />
                    <input type="hidden" name="adherentId" value={a.id} />
                    <input type="hidden" name="recherche" value={recherche} />
                    <Button type="submit" taille="sm">
                      <UserPlus className="size-4" />
                      Reserver
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
