// Registre de presence de la salle.
//
// L'ecran qui manquait : la borne montre les douze derniers passages, la
// fiche d'un adherent les vingt siens, mais "qui est venu le 3 septembre ?"
// n'avait aucune reponse. Server Component — les agregations partent vers
// PostgreSQL et aucun gymId n'apparait dans l'URL (§9), listerPointages le
// resout depuis la session.
//
// /!\ Ecran de CONSULTATION. Il ne propose aucune action sur un contrat : la
// presence s'observe, elle ne se sanctionne pas (§9).
import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Download,
  ScanLine,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { BarreFiltresRegistre } from "@/components/pointage/barre-filtres-registre";
import { TableRegistre } from "@/components/pointage/table-registre";
import { listerPointages, SOURCES, type SourceRegistre } from "@/lib/data/pointage";

export const metadata = { title: "Registre de presence — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

/** Une chaine, ou undefined. Un parametre repete ("?du=a&du=b") arrive en
 *  tableau : on l'ecarte plutot que d'en choisir un au hasard. */
function texte(valeur: string | string[] | undefined): string | undefined {
  return typeof valeur === "string" && valeur !== "" ? valeur : undefined;
}

/* Les dates sont revalidees en profondeur par lib/data/pointage.ts (une date
   impossible y est rejetee). Ici on ne fait que la forme, pour reconstruire
   des URL propres et ne pas renvoyer au navigateur ce qu'il a invente. */
function dateISO(valeur: string | string[] | undefined): string | undefined {
  const v = texte(valeur);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

export default async function PageRegistre({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const recherche = texte(params.recherche);
  const du = dateISO(params.du);
  const au = dateISO(params.au);

  // Liste blanche : une source inventee dans la barre d'adresse est ignoree,
  // jamais transmise telle quelle a Prisma.
  const sourceBrute = texte(params.source);
  const source = SOURCES.includes(sourceBrute as SourceRegistre)
    ? (sourceBrute as SourceRegistre)
    : undefined;

  const filtres = { page, recherche, du, au, source };
  const { passages, total, pages, adherentsVenus, aRegulariser } =
    await listerPointages(filtres);

  /* Les criteres valides — pas ceux recus — reconstruisent les URL. Un
     parametre farfelu disparait donc de la pagination et de l'export au lieu
     de s'y propager. */
  const criteres = (sansPage = false) => {
    const q = new URLSearchParams();
    if (recherche) q.set("recherche", recherche);
    if (du) q.set("du", du);
    if (au) q.set("au", au);
    if (source) q.set("source", source);
    if (!sansPage && page > 1) q.set("page", String(page));
    return q;
  };

  const hrefPour = (p: number) => {
    const q = criteres(true);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/pointage/registre?${s}` : "/pointage/registre";
  };

  const hrefExport = `/api/pointage/export?${criteres(true)}`;
  const filtreActif = Boolean(recherche || du || au || source);
  const periode = libellePeriode(du, au);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Registre de presence"
        sousTitre={`Journal des passages · ${periode}`}
        action={
          <div className="flex gap-2">
            <Link href="/pointage">
              <Button variante="contour">
                <ScanLine className="size-4" />
                Borne
              </Button>
            </Link>
            {/* Un <a> et non un <Link> : c'est un telechargement, pas une
                navigation. Next.js prefetcherait la route et Chrome
                garderait la page en place sans jamais poser le fichier. */}
            <a href={hrefExport} download>
              <Button variante="contour">
                <Download className="size-4" />
                Exporter
              </Button>
            </a>
          </div>
        }
      />

      <div className="cascade grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Passages"
          valeur={String(total)}
          icone={<CalendarCheck className="size-4" />}
          precision="sur la selection"
        />
        <StatCard
          label="Adherents venus"
          valeur={String(adherentsVenus)}
          icone={<Users className="size-4" />}
          teinte="success"
          precision="personnes distinctes"
        />
        <StatCard
          label="A regulariser"
          valeur={String(aRegulariser)}
          icone={<TriangleAlert className="size-4" />}
          teinte="warning"
          precision="passages sans abonnement valide"
        />
      </div>

      {/* useSearchParams impose une frontiere Suspense dans une page rendue
          cote serveur. */}
      <Suspense fallback={<div className="h-11" />}>
        <BarreFiltresRegistre />
      </Suspense>

      <Card className="overflow-hidden">
        {passages.length === 0 ? (
          filtreActif ? (
            <EmptyState
              icone={<CalendarCheck className="size-5" />}
              titre="Aucun passage sur cette selection"
              description="Elargissez les dates, ou retirez le filtre de source."
            />
          ) : (
            <EmptyState
              icone={<CalendarCheck className="size-5" />}
              titre="Aucun passage enregistre"
              description="Le registre se remplit tout seul des que la borne d'accueil enregistre une entree."
              action={
                <Link href="/pointage">
                  <Button>Ouvrir la borne</Button>
                </Link>
              }
            />
          )
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
              <span className="text-sm text-muted">
                {total} passage{total > 1 ? "s" : ""} sur cette selection
              </span>
              <span className="text-sm">
                <span className="text-muted">Frequentation </span>
                <strong className="font-semibold text-ink">
                  {adherentsVenus} adherent{adherentsVenus > 1 ? "s" : ""}
                </strong>
              </span>
            </div>

            <TableRegistre lignes={passages} />
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
        Un passage est enregistre meme lorsque l&apos;abonnement est termine :
        la borne informe, elle ne refuse pas l&apos;entree. Le statut affiche
        est celui du jour du passage, pas celui d&apos;aujourd&apos;hui.
      </p>
    </div>
  );
}

/** "du 01/09/2026 au 05/09/2026", "depuis le 01/09/2026", "tout l'historique". */
function libellePeriode(du?: string, au?: string): string {
  const jjmmaaaa = (iso: string) => iso.split("-").reverse().join("/");

  if (du && au) {
    return du === au
      ? `le ${jjmmaaaa(du)}`
      : `du ${jjmmaaaa(du)} au ${jjmmaaaa(au)}`;
  }
  if (du) return `depuis le ${jjmmaaaa(du)}`;
  if (au) return `jusqu'au ${jjmmaaaa(au)}`;
  return "tout l'historique";
}
