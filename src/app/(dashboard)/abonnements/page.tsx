// Liste globale des abonnements de la salle.
//
// Server Component : la requete part directement vers PostgreSQL, aucun
// critere de filtrage ne transite par le navigateur et aucun gymId n'apparait
// dans l'URL (§9) — listerAbonnements le resout elle-meme depuis la session.
import { Suspense } from "react";
import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { BarreFiltres } from "@/components/abonnements/barre-filtres";
import { TableAbonnements } from "@/components/abonnements/table-abonnements";
import {
  listerAbonnements,
  statistiquesAbonnements,
  synchroniserExpirations,
  VUES,
  type VueAbonnements,
} from "@/lib/data/abonnement";
import { parametresSalle } from "@/lib/data/gym";
import { formatFCFA } from "@/lib/utils/format";

export const metadata = { title: "Abonnements — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PageAbonnements({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Les parametres d'URL viennent de l'utilisateur : on ne leur fait aucune
  // confiance. Une vue inconnue retombe sur "tous", elle n'est pas transmise
  // a Prisma telle quelle.
  const page = Math.max(1, Number(params.page) || 1);
  const recherche =
    typeof params.recherche === "string" ? params.recherche : undefined;
  const vueBrute = typeof params.vue === "string" ? params.vue : "";
  const vue = VUES.includes(vueBrute as VueAbonnements)
    ? (vueBrute as VueAbonnements)
    : "tous";

  // Les statuts echus sont remis a jour avant lecture : sans cela un
  // abonnement termine hier apparaitrait encore dans "En cours".
  // Lot 2 : deplacer dans une tache planifiee quotidienne.
  await synchroniserExpirations();

  const [{ abonnements, total, pages }, stats, gym] = await Promise.all([
    listerAbonnements({ page, recherche, vue }),
    statistiquesAbonnements(),
    parametresSalle(),
  ]);

  const hrefPour = (p: number) => {
    const q = new URLSearchParams();
    if (recherche) q.set("recherche", recherche);
    if (vue !== "tous") q.set("vue", vue);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/abonnements?${s}` : "/abonnements";
  };

  const filtreActif = Boolean(recherche) || vue !== "tous";

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Abonnements"
        sousTitre={
          stats.compteurs.tous > 0
            ? `${stats.compteurs["en-cours"]} en cours · ${formatFCFA(stats.montantEnCours)} souscrits`
            : "Aucun abonnement pour le moment"
        }
        action={
          <Link href="/adherents">
            <Button>
              <Plus className="size-4" />
              Nouvel abonnement
            </Button>
          </Link>
        }
      />

      {/* useSearchParams impose une frontiere Suspense dans une page rendue
          cote serveur. */}
      <Suspense fallback={<div className="h-11" />}>
        <BarreFiltres compteurs={stats.compteurs} />
      </Suspense>

      <Card className="overflow-hidden">
        {abonnements.length === 0 ? (
          filtreActif ? (
            <EmptyState
              icone={<CreditCard className="size-5" />}
              titre="Aucun resultat"
              description="Aucun abonnement ne correspond a ces criteres. Essayez un autre nom ou revenez a l'onglet « Tous »."
            />
          ) : (
            <EmptyState
              icone={<CreditCard className="size-5" />}
              titre="Aucun abonnement souscrit"
              description="Un abonnement se souscrit depuis la fiche d'un adherent : ouvrez sa fiche, puis « Souscrire un abonnement »."
              action={
                <Link href="/adherents">
                  <Button>Voir les adherents</Button>
                </Link>
              }
            />
          )
        ) : (
          <>
            <TableAbonnements lignes={abonnements} nomSalle={gym.nom} />
            <Pagination
              page={page}
              pages={pages}
              total={total}
              hrefPour={hrefPour}
            />
          </>
        )}
      </Card>

      <p className="text-xs text-muted">
        Chaque ligne conserve le nom, le tarif et la date de fin du jour de la
        vente. Modifier une formule ne change aucun abonnement deja souscrit.
      </p>
    </div>
  );
}
