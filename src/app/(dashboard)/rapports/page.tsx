// Rapports (Lot 5) : lecture seule, agregations de ce qui est deja en base.
// Server Component : tout se calcule cote serveur, rien n'arrive brut au
// navigateur.
import { BarChart3, Download, RefreshCw, TrendingUp, UserCheck, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { GrapheSouscriptions } from "@/components/tableau-bord/graphe-souscriptions";
import { RepartitionMethodes } from "@/components/rapports/repartition-methodes";
import { TableAssiduite } from "@/components/rapports/table-assiduite";
import { FiltrePeriode } from "@/components/rapports/filtre-periode";
import { PageHeader } from "@/components/layout/page-header";
import {
  adherentsAssidus,
  repartitionMethodesPaiement,
  revenusEncaissesParMois,
  tauxRenouvellement,
  PERIODES_RAPPORT,
  type PeriodeRapport,
} from "@/lib/data/rapport";
import { formatFCFA } from "@/lib/utils/format";

export const metadata = { title: "Rapports — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

function estPeriodeValide(v: number): v is PeriodeRapport {
  return (PERIODES_RAPPORT as readonly number[]).includes(v);
}

export default async function PageRapports({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;

  // Le parametre vient de l'URL : on ne lui fait aucune confiance. Une valeur
  // hors liste blanche retombe sur 12, jamais transmise telle quelle a la
  // couche de donnees.
  const moisBrut = Number(params.mois);
  const mois = estPeriodeValide(moisBrut) ? moisBrut : 12;

  const [revenus, methodes, renouvellement, assidus] = await Promise.all([
    revenusEncaissesParMois(mois),
    repartitionMethodesPaiement(mois),
    tauxRenouvellement(mois),
    adherentsAssidus(mois * 30, 10),
  ]);

  const totalEncaisse = revenus.reduce((s, m) => s + m.montant, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Rapports"
        sousTitre={`Ce qui est reellement encaisse, sur les ${mois} derniers mois.`}
        action={
          <a href={`/api/rapports/export?mois=${mois}`}>
            <Button variante="contour">
              <Download className="size-4" />
              Exporter en CSV
            </Button>
          </a>
        }
      />

      <FiltrePeriode actif={mois} />

      <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Encaisse (${mois} mois)`}
          valeur={formatFCFA(totalEncaisse)}
          icone={<Wallet className="size-4" />}
          teinte="success"
          precision="tous moyens de paiement confondus"
        />
        <StatCard
          label="Taux de renouvellement"
          valeur={
            renouvellement.taux === null ? "—" : `${renouvellement.taux} %`
          }
          icone={<RefreshCw className="size-4" />}
          teinte="brand"
          precision={
            renouvellement.total === 0
              ? "pas encore d'echeance sur la periode"
              : `${renouvellement.renouveles} / ${renouvellement.total} abonnements echus depuis 14 j+`
          }
        />
        <StatCard
          label="Adherents assidus"
          valeur={String(assidus.length)}
          icone={<UserCheck className="size-4" />}
          teinte="info"
          precision={`ont pointe sur la periode (${mois * 30} j)`}
        />
        <StatCard
          label="Methodes actives"
          valeur={String(methodes.lignes.length)}
          icone={<TrendingUp className="size-4" />}
          precision="moyens de paiement utilises"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titre={`Encaissements (${mois} mois)`}
            icone={<Wallet className="size-4 text-brand" />}
          />
          <CardBody>
            {totalEncaisse === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Aucun encaissement enregistre sur la periode.
              </p>
            ) : (
              <GrapheSouscriptions donnees={revenus} libelleSerie="Encaisse" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titre="Repartition par methode"
            icone={<BarChart3 className="size-4 text-brand" />}
          />
          <CardBody>
            {methodes.total === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Aucun encaissement sur la periode.
              </p>
            ) : (
              <RepartitionMethodes lignes={methodes.lignes} total={methodes.total} />
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          titre="Adherents les plus assidus"
          icone={<UserCheck className="size-4 text-brand" />}
          action={
            <span className="text-xs text-muted">{mois * 30} derniers jours</span>
          }
        />
        {assidus.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Aucun passage enregistre sur la periode.
          </p>
        ) : (
          <TableAssiduite lignes={assidus} />
        )}
      </Card>

      <p className="text-xs text-muted">
        Le taux de renouvellement laisse un delai de 14 jours a chaque
        adherent avant de compter son abonnement comme non renouvele : une
        echeance trop recente n&apos;a pas encore eu le temps d&apos;etre
        suivie d&apos;un nouvel abonnement.
      </p>
    </div>
  );
}
