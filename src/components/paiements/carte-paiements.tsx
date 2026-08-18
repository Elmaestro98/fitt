// Bloc "Paiements" de la fiche adherent : ce qui reste du sur l'abonnement en
// cours, le bouton d'encaissement, puis le journal complet.
import { Wallet } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ModalePaiement,
  type AbonnementAPayer,
} from "@/components/paiements/modale-paiement";
import {
  JournalPaiements,
  type LignePaiement,
} from "@/components/paiements/journal-paiements";
import { formatFCFA } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function CartePaiements({
  adherentId,
  nomAdherent,
  abonnement,
  solde,
  paiements,
}: {
  adherentId: string;
  nomAdherent: string;
  abonnement: AbonnementAPayer | null;
  /** null s'il n'y a aucun abonnement en cours. */
  solde: { du: number; encaisse: number; reste: number } | null;
  paiements: LignePaiement[];
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        titre="Paiements"
        icone={<Wallet className="size-4 text-brand" />}
        action={
          <ModalePaiement
            adherentId={adherentId}
            nomAdherent={nomAdherent}
            abonnement={abonnement}
            variante="contour"
            taille="sm"
            libelle="Encaisser"
          />
        }
      />

      {solde && (
        <CardBody className="pb-4">
          <div className="rounded-control bg-sunken p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-muted">
                Abonnement en cours · {formatFCFA(solde.du)}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  solde.reste > 0 ? "text-danger" : "text-success",
                )}
              >
                {solde.reste > 0
                  ? `Reste ${formatFCFA(solde.reste)}`
                  : "Solde"}
              </span>
            </div>

            {/* Jauge de couverture : ce qui est encaisse sur ce qui est du. */}
            <div
              className="mt-3 h-2 overflow-hidden rounded-pill bg-line"
              role="progressbar"
              aria-valuenow={Math.min(
                100,
                Math.round((solde.encaisse / Math.max(1, solde.du)) * 100),
              )}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Part encaissee de l'abonnement"
            >
              <div
                className={cn(
                  "h-full rounded-pill",
                  solde.reste > 0 ? "bg-warning" : "bg-success",
                )}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round((solde.encaisse / Math.max(1, solde.du)) * 100),
                    ),
                  )}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-muted">
              {formatFCFA(solde.encaisse)} encaisses sur {formatFCFA(solde.du)}.
            </p>
          </div>
        </CardBody>
      )}

      {paiements.length === 0 ? (
        <EmptyState
          icone={<Wallet className="size-5" />}
          titre="Aucun paiement enregistre"
          description="Enregistrez ce que l'adherent verse, en especes, par Wave ou par Orange Money."
          action={
            <ModalePaiement
              adherentId={adherentId}
              nomAdherent={nomAdherent}
              abonnement={abonnement}
            />
          }
        />
      ) : (
        <>
          <JournalPaiements
            paiements={paiements}
            adherentId={adherentId}
            nomAdherent={nomAdherent}
          />
          <CardBody className="pt-4">
            <p className="text-xs text-muted">
              Un paiement n&apos;est jamais supprime. Une annulation ajoute une
              ecriture negative en face, visible ci-dessus.
            </p>
          </CardBody>
        </>
      )}
    </Card>
  );
}
