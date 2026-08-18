// Liste des adherents. Server Component : la requete part directement vers
// PostgreSQL, aucune donnee de filtrage ne transite par le navigateur.
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { BarreFiltres } from "@/components/adherents/barre-filtres";
import { TableAdherents } from "@/components/adherents/table-adherents";
import { listerAdherents } from "@/lib/data/adherent";
import type { StatutAdherent } from "@/generated/prisma/enums";

const STATUTS_VALIDES = [
  "ACTIF",
  "EXPIRE",
  "SUSPENDU",
  "EN_ATTENTE_VALIDATION",
  "ARCHIVE",
] as const;

export const metadata = { title: "Adherents — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PageAdherents({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Les parametres d'URL viennent de l'utilisateur : on ne leur fait aucune
  // confiance. Un statut inconnu est ignore, pas transmis a Prisma.
  const page = Math.max(1, Number(params.page) || 1);
  const recherche =
    typeof params.recherche === "string" ? params.recherche : undefined;
  const statutBrut = typeof params.statut === "string" ? params.statut : "";
  const statut = STATUTS_VALIDES.includes(statutBrut as StatutAdherent)
    ? (statutBrut as StatutAdherent)
    : undefined;

  // Aucun gymId ici : listerAdherents() le resout elle-meme depuis la session.
  const { adherents, total, pages } = await listerAdherents({
    page,
    recherche,
    statut,
  });

  const hrefPour = (p: number) => {
    const q = new URLSearchParams();
    if (recherche) q.set("recherche", recherche);
    if (statut) q.set("statut", statut);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/adherents?${s}` : "/adherents";
  };

  const filtreActif = Boolean(recherche || statut);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Adherents"
        sousTitre={
          total > 0
            ? `${total} adherent${total > 1 ? "s" : ""}`
            : "Aucun adherent pour le moment"
        }
        action={
          <Button disabled>
            <Plus className="size-4" />
            Nouvel adherent
          </Button>
        }
      />

      <Suspense fallback={<div className="h-11" />}>
        <BarreFiltres />
      </Suspense>

      <Card className="overflow-hidden">
        {adherents.length === 0 ? (
          filtreActif ? (
            <EmptyState
              icone={<Users className="size-5" />}
              titre="Aucun resultat"
              description="Aucun adherent ne correspond a ces criteres. Essayez un autre nom ou retirez le filtre de statut."
            />
          ) : (
            <EmptyState
              icone={<Users className="size-5" />}
              titre="Votre premier adherent"
              description="Enregistrez les adherents de votre salle pour suivre leurs abonnements, leurs paiements et leurs passages."
              action={
                <Button disabled>
                  <Plus className="size-4" />
                  Nouvel adherent
                </Button>
              }
            />
          )
        ) : (
          <>
            <TableAdherents adherents={adherents} />
            <Pagination
              page={page}
              pages={pages}
              total={total}
              hrefPour={hrefPour}
            />
          </>
        )}
      </Card>
    </div>
  );
}
