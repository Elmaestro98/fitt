// Tableau de bord. Structure reprise de public/maquette.png.
// Server Component : toutes les agregations partent vers PostgreSQL, rien
// n'est calcule dans le navigateur.
//
// La periode d'observation vit dans l'URL (?periode=30j, ou ?du=...&au=...),
// jamais dans un etat client : la vue est partageable, le bouton "retour"
// fonctionne, et le serveur reste seul a decider ce que ces parametres
// veulent dire (lib/utils/periode.ts).
import { Suspense } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChartPie,
  Plus,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { FiltrePeriode } from "@/components/tableau-bord/filtre-periode";
import { GrapheFrequentation } from "@/components/tableau-bord/graphe-frequentation";
import { GrapheSouscriptions } from "@/components/tableau-bord/graphe-souscriptions";
import { RepartitionFormules } from "@/components/tableau-bord/repartition-formules";
import { TableExpirations } from "@/components/tableau-bord/table-expirations";
import { AdherentsQuiDecrochent } from "@/components/tableau-bord/adherents-qui-decrochent";
import { synchroniserExpirations } from "@/lib/data/abonnement";
import { adherentsQuiDecrochent } from "@/lib/data/decrochage";
import {
  abonnementsExpirantBientot,
  evolutionSouscriptions,
  frequentationPeriode,
  repartitionFormules,
  statistiquesTableauDeBord,
} from "@/lib/data/tableau-bord";
import {
  getTenantContext,
  AucuneSalleActiveError,
  SalleIntrouvableError,
} from "@/lib/tenant";
import { formatFCFA } from "@/lib/utils/format";
import { resoudrePeriode, versDateISO } from "@/lib/utils/periode";

export const metadata = { title: "Tableau de bord — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

/** Une valeur d'URL peut arriver en tableau (?du=x&du=y) : on ne garde que
 *  les chaines, le reste est ignore et retombera sur le defaut. */
function texte(valeur: string | string[] | undefined): string | undefined {
  return typeof valeur === "string" ? valeur : undefined;
}

function aujourdhui() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(new Date());
}

export default async function PageTableauDeBord({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  let gym;
  try {
    ({ gym } = await getTenantContext());
  } catch (erreur) {
    if (erreur instanceof AucuneSalleActiveError) {
      return (
        <Avertissement titre="Aucune salle active">
          Utilisez le selecteur de salle en haut a droite.
        </Avertissement>
      );
    }
    if (erreur instanceof SalleIntrouvableError) {
      return (
        <Avertissement titre="Salle non initialisee">
          <Link href="/salle/initialisation" className="font-medium underline">
            Terminer l&apos;initialisation
          </Link>
        </Avertissement>
      );
    }
    throw erreur;
  }

  const params = await searchParams;

  // Les parametres viennent de l'utilisateur : aucune de ces trois chaines
  // n'atteint Prisma telle quelle. resoudrePeriode les valide contre une
  // liste blanche, reanalyse les dates, borne le recul a trois ans, et
  // retombe sur le mois en cours a la moindre anomalie.
  const periode = resoudrePeriode({
    periode: texte(params.periode),
    du: texte(params.du),
    au: texte(params.au),
  });

  // Les statuts echus sont mis a jour avant lecture, sinon les compteurs
  // afficheraient comme actifs des abonnements termines hier.
  await synchroniserExpirations();

  const [
    stats,
    evolution,
    repartition,
    expirations,
    frequentation,
    decrochages,
  ] = await Promise.all([
    statistiquesTableauDeBord(periode),
    evolutionSouscriptions(periode),
    repartitionFormules(),
    abonnementsExpirantBientot(),
    frequentationPeriode(periode),
    adherentsQuiDecrochent(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Vue d'ensemble"
        sousTitre={`${gym.nom} · aujourd'hui, ${aujourdhui()}`}
        action={
          <Link href="/adherents/nouveau">
            <Button>
              <Plus className="size-4" />
              Nouvel adherent
            </Button>
          </Link>
        }
      />

      {/* useSearchParams impose une frontiere Suspense dans une page rendue
          cote serveur. Le repli occupe la hauteur exacte de la barre : sans
          lui, tout l'ecran sauterait d'un cran a l'arrivee du filtre. */}
      <Suspense fallback={<div className="h-9" />}>
        <FiltrePeriode
          cle={periode.cle}
          libelle={periode.libelle}
          debutISO={versDateISO(periode.debut)}
          finISO={versDateISO(periode.dernierJour)}
          // Le plafond des deux champs est AUJOURD'HUI, jamais le dernier
          // jour de la periode affichee : sinon, apres avoir consulte le mois
          // d'avril, on ne pourrait plus etendre sa plage au-dela d'avril.
          // Calcule ici, cote serveur, et non dans le composant : deux
          // `new Date()` de part et d'autre tomberaient sur deux jours
          // differents autour de minuit, et React signalerait une erreur
          // d'hydratation.
          maxISO={versDateISO(new Date())}
        />
      </Suspense>

      {/* cascade : les quatre indicateurs se posent de gauche a droite. Le
          regard suit le mouvement dans l'ordre d'importance, au lieu de
          recevoir quatre chiffres d'un bloc. */}
      <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Les deux premieres cartes ne suivent PAS le filtre, et leur
            libelle le dit : ce sont des etats vrais maintenant. "142
            adherents actifs au mois de juin" ne voudrait rien dire. */}
        <StatCard
          label="Adherents actifs"
          valeur={String(stats.adherentsActifs)}
          icone={<Users className="size-4" />}
          precision={`sur ${stats.adherentsTotal} au fichier, aujourd'hui`}
          href="/adherents?statut=ACTIF"
        />
        <StatCard
          label="Expirations (7 j)"
          valeur={String(stats.expirations7j)}
          icone={<CalendarClock className="size-4" />}
          teinte="warning"
          precision="a renouveler dans les jours qui viennent"
          href="/abonnements?vue=bientot"
        />
        <StatCard
          label={`Souscrit · ${periode.libelleCourt}`}
          valeur={formatFCFA(stats.souscritPeriode)}
          icone={<TrendingUp className="size-4" />}
          teinte="success"
          variation={stats.variationCA}
          referenceVariation={periode.libelleComparaison}
          precision="aucune souscription sur la periode precedente"
          href="/abonnements"
        />
        <StatCard
          label={`Nouveaux · ${periode.libelleCourt}`}
          valeur={String(stats.nouveauxPeriode)}
          icone={<UserPlus className="size-4" />}
          teinte="info"
          variation={stats.variationNouveaux}
          referenceVariation={periode.libelleComparaison}
          precision="aucune inscription sur la periode precedente"
          href="/adherents"
        />
      </div>

      <p className="text-xs text-muted">
        Le filtre s&apos;applique aux montants souscrits, aux nouvelles
        inscriptions et a la frequentation. Les adherents actifs, les
        echeances a venir et la repartition des formules decrivent la
        situation d&apos;aujourd&apos;hui et ne changent pas avec la periode.
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre={`Souscriptions · ${periode.libelle.toLowerCase()}`}
            icone={<TrendingUp className="size-4 text-brand" />}
          />
          <CardBody>
            <GrapheSouscriptions donnees={evolution} />
            <p className="mt-3 text-xs text-muted">
              Montants souscrits, pas encaisses.{" "}
              <Link href="/paiements" className="text-brand hover:underline">
                Voir les encaissements reels
              </Link>
              .
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titre="Repartition"
            icone={<ChartPie className="size-4 text-brand" />}
          />
          <CardBody>
            {repartition.total === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Aucun abonnement en cours.
              </p>
            ) : (
              <RepartitionFormules
                lignes={repartition.lignes}
                total={repartition.total}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          titre="Abonnements expirant bientot"
          icone={<CalendarClock className="size-4 text-brand" />}
          action={
            <Link
              href="/adherents?statut=ACTIF"
              className="text-sm font-medium text-brand hover:underline"
            >
              Voir tout
            </Link>
          }
        />
        {expirations.length === 0 ? (
          <EmptyState
            icone={<CalendarClock className="size-5" />}
            titre="Aucune echeance sous 30 jours"
            description="Tous les abonnements en cours courent encore plus d'un mois."
          />
        ) : (
          <TableExpirations lignes={expirations} />
        )}
      </Card>

      {/* Juste apres les echeances, et c'est voulu : les deux repondent a
          "qui faut-il relancer ?". La difference, c'est que celle-ci ne se
          voit nulle part ailleurs — un adherent qui paie sans venir n'apparait
          dans aucun compteur tant qu'il n'a pas cesse de payer. */}
      <AdherentsQuiDecrochent
        adherents={decrochages.slice(0, 6)}
        total={decrochages.length}
        nomSalle={gym.nom}
      />

      <Card>
        <CardHeader
          titre={`Frequentation · ${periode.libelle.toLowerCase()}`}
          icone={<UserCheck className="size-4 text-brand" />}
          action={
            <Link
              href="/pointage"
              className="text-sm font-medium text-brand hover:underline"
            >
              Ouvrir la borne
            </Link>
          }
        />
        <CardBody>
          {frequentation.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Aucun passage sur cette periode. Les entrees apparaitront ici des
              le premier pointage.
            </p>
          ) : (
            <>
              <GrapheFrequentation donnees={frequentation.jours} />
              <p className="mt-3 text-xs text-muted">
                {frequentation.total} passage
                {frequentation.total > 1 ? "s" : ""} en {periode.jours} jour
                {periode.jours > 1 ? "s" : ""}
                {/* La moyenne quotidienne est le seul chiffre comparable
                    d'une periode a l'autre quand elles n'ont pas la meme
                    longueur : 300 passages ne disent rien tant qu'on ignore
                    s'ils couvrent une semaine ou un trimestre. */}
                {periode.jours > 1
                  ? ` · ${frequentation.moyenneParJour} par jour en moyenne`
                  : ""}
                {frequentation.pointe
                  ? ` · affluence maximale vers ${frequentation.pointe}`
                  : ""}
                .
              </p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Avertissement({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-warning/40 bg-warning-soft">
      <CardBody className="pt-5">
        <h2 className="font-semibold text-ink">{titre}</h2>
        <p className="mt-2 text-sm text-ink/80">{children}</p>
      </CardBody>
    </Card>
  );
}
