// Journal de caisse de la salle.
//
// Server Component : les agregations partent vers PostgreSQL, aucun gymId
// n'apparait dans l'URL (§9) — listerPaiements le resout depuis la session.
import { Suspense } from "react";
import Link from "next/link";
import { Banknote, CalendarDays, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { BarreFiltres } from "@/components/paiements/barre-filtres";
import { TablePaiements } from "@/components/paiements/table-paiements";
import {
  listerPaiements,
  PERIODES,
  METHODES,
  statistiquesPaiements,
  type Periode,
} from "@/lib/data/paiement";
import type { MethodePaiement } from "@/generated/prisma/enums";
import { formatFCFA } from "@/lib/utils/format";

export const metadata = { title: "Paiements — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PagePaiements({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Les parametres d'URL viennent de l'utilisateur : une periode ou une
  // methode inconnue est ignoree, jamais transmise telle quelle a Prisma.
  const page = Math.max(1, Number(params.page) || 1);
  const recherche =
    typeof params.recherche === "string" ? params.recherche : undefined;

  const periodeBrute = typeof params.periode === "string" ? params.periode : "";
  const periode = PERIODES.includes(periodeBrute as Periode)
    ? (periodeBrute as Periode)
    : "tout";

  const methodeBrute = typeof params.methode === "string" ? params.methode : "";
  const methode = METHODES.includes(methodeBrute as MethodePaiement)
    ? (methodeBrute as MethodePaiement)
    : undefined;

  const [{ paiements, total, pages, montantTotal }, stats] = await Promise.all([
    listerPaiements({ page, recherche, methode, periode }),
    statistiquesPaiements(),
  ]);

  const hrefPour = (p: number) => {
    const q = new URLSearchParams();
    if (recherche) q.set("recherche", recherche);
    if (periode !== "tout") q.set("periode", periode);
    if (methode) q.set("methode", methode);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/paiements?${s}` : "/paiements";
  };

  const filtreActif = Boolean(recherche || methode) || periode !== "tout";

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Paiements"
        sousTitre="Journal de caisse de la salle"
        action={
          <Link href="/adherents">
            <Button>
              <Wallet className="size-4" />
              Encaisser
            </Button>
          </Link>
        }
      />

      <div className="cascade grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Encaisse aujourd'hui"
          valeur={formatFCFA(stats.jour)}
          icone={<Banknote className="size-4" />}
          teinte="success"
          precision="net des annulations du jour"
        />
        <StatCard
          label="Cette semaine"
          valeur={formatFCFA(stats.semaine)}
          icone={<CalendarDays className="size-4" />}
          precision="depuis lundi"
        />
        <StatCard
          label="Ce mois"
          valeur={formatFCFA(stats.mois)}
          icone={<Wallet className="size-4" />}
          teinte="info"
          precision={repartition(stats.parMethode)}
        />
      </div>

      {/* useSearchParams impose une frontiere Suspense dans une page rendue
          cote serveur. */}
      <Suspense fallback={<div className="h-11" />}>
        <BarreFiltres />
      </Suspense>

      <Card className="overflow-hidden">
        {paiements.length === 0 ? (
          filtreActif ? (
            <EmptyState
              icone={<Wallet className="size-5" />}
              titre="Aucun paiement sur cette periode"
              description="Elargissez la periode ou retirez le filtre de methode."
            />
          ) : (
            <EmptyState
              icone={<Wallet className="size-5" />}
              titre="Aucun paiement enregistre"
              description="Un paiement s'encaisse depuis la fiche d'un adherent : ouvrez sa fiche, puis « Encaisser »."
              action={
                <Link href="/adherents">
                  <Button>Voir les adherents</Button>
                </Link>
              }
            />
          )
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
              <span className="text-sm text-muted">
                {total} ecriture{total > 1 ? "s" : ""} sur cette selection
              </span>
              <span className="text-sm">
                <span className="text-muted">Total net </span>
                <strong className="font-semibold text-ink">
                  {formatFCFA(montantTotal)}
                </strong>
              </span>
            </div>

            <TablePaiements lignes={paiements} />
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
        Le total est net : une annulation figure comme une ecriture negative et
        vient s&apos;en deduire. Aucun paiement n&apos;est jamais supprime.
      </p>
    </div>
  );
}

/** "Especes 120 000 · Wave 45 000" — la composition de la recette du mois. */
function repartition(parMethode: Partial<Record<string, number>>) {
  const libelles: Record<string, string> = {
    ESPECES: "Especes",
    WAVE: "Wave",
    ORANGE_MONEY: "Orange Money",
  };

  const lignes = Object.entries(parMethode)
    .filter(([, montant]) => (montant ?? 0) !== 0)
    .map(([cle, montant]) => `${libelles[cle] ?? cle} ${formatFCFA(montant!)}`);

  return lignes.length > 0 ? lignes.join(" · ") : "aucun encaissement ce mois";
}
