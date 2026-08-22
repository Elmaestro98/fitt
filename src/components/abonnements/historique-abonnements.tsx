import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils/format";

type Ligne = {
  id: string;
  nomFormule: string;
  prixPaye: number;
  debutLe: Date;
  finLe: Date;
  statut: string;
  motifAnnul: string | null;
};

const TONS = {
  ACTIF: { libelle: "En cours", ton: "succes" },
  EXPIRE: { libelle: "Termine", ton: "neutre" },
  ANNULE: { libelle: "Annule", ton: "danger" },
} as const;

export function HistoriqueAbonnements({ abonnements }: { abonnements: Ligne[] }) {
  if (abonnements.length === 0) return null;

  return (
    <Card>
      <CardHeader
        titre="Historique des abonnements"
        icone={<History className="size-4 text-muted" />}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <Th>Formule</Th>
              <Th>Periode</Th>
              <Th>Montant</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {abonnements.map((a) => {
              const { libelle, ton } = TONS[a.statut as keyof typeof TONS];
              return (
                <tr key={a.id}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink">{a.nomFormule}</span>
                    {a.motifAnnul && (
                      <span className="block text-xs text-muted">
                        Motif : {a.motifAnnul}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted">
                    {formatDate(a.debutLe)} → {formatDate(a.finLe)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-ink">
                    {formatFCFA(a.prixPaye)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge ton={ton}>{libelle}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CardBody className="pt-4">
        <p className="text-xs text-muted">
          Chaque ligne conserve le tarif du jour de la vente. Un abonnement
          n&apos;est jamais supprime, seulement annule avec motif.
        </p>
      </CardBody>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="display px-5 py-3 text-xs font-semibold tracking-wide text-muted uppercase">
      {children}
    </th>
  );
}
