// Tableau de bord. Structure reprise de public/maquette.png.
// Server Component : toutes les agregations partent vers PostgreSQL, rien
// n'est calcule dans le navigateur.
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
import { GrapheFrequentation } from "@/components/tableau-bord/graphe-frequentation";
import { GrapheSouscriptions } from "@/components/tableau-bord/graphe-souscriptions";
import { RepartitionFormules } from "@/components/tableau-bord/repartition-formules";
import { TableExpirations } from "@/components/tableau-bord/table-expirations";
import { synchroniserExpirations } from "@/lib/data/abonnement";
import {
  abonnementsExpirantBientot,
  evolutionSouscriptions,
  frequentationHebdomadaire,
  repartitionFormules,
  statistiquesTableauDeBord,
} from "@/lib/data/tableau-bord";
import {
  getTenantContext,
  AucuneSalleActiveError,
  SalleIntrouvableError,
} from "@/lib/tenant";
import { formatFCFA } from "@/lib/utils/format";

export const metadata = { title: "Tableau de bord — Fitt" };

function aujourdhui() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(new Date());
}

export default async function PageTableauDeBord() {
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

  // Les statuts echus sont mis a jour avant lecture, sinon les compteurs
  // afficheraient comme actifs des abonnements termines hier.
  await synchroniserExpirations();

  const [stats, evolution, repartition, expirations, frequentation] =
    await Promise.all([
      statistiquesTableauDeBord(),
      evolutionSouscriptions(),
      repartitionFormules(),
      abonnementsExpirantBientot(),
      frequentationHebdomadaire(),
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Adherents actifs"
          valeur={String(stats.adherentsActifs)}
          icone={<Users className="size-4" />}
          precision={`sur ${stats.adherentsTotal} au fichier`}
        />
        <StatCard
          label="Expirations (7 j)"
          valeur={String(stats.expirations7j)}
          icone={<CalendarClock className="size-4" />}
          teinte="warning"
          precision="abonnements a renouveler"
        />
        <StatCard
          label="Souscrit ce mois"
          valeur={formatFCFA(stats.souscritMois)}
          icone={<TrendingUp className="size-4" />}
          teinte="success"
          variation={stats.variationCA}
          precision="aucune reference le mois dernier"
        />
        <StatCard
          label="Nouveaux adherents"
          valeur={String(stats.nouveauxMois)}
          icone={<UserPlus className="size-4" />}
          teinte="info"
          variation={stats.variationNouveaux}
          precision="inscrits ce mois-ci"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre="Souscriptions (6 mois)"
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

      <Card>
        <CardHeader
          titre="Frequentation (7 jours)"
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
              Aucun passage cette semaine. Les entrees apparaitront ici des le
              premier pointage.
            </p>
          ) : (
            <>
              <GrapheFrequentation donnees={frequentation.jours} />
              <p className="mt-3 text-xs text-muted">
                {frequentation.total} passage
                {frequentation.total > 1 ? "s" : ""} sur sept jours
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
