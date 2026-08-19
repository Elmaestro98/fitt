// Les abonnements de l'adherent, en cours et passes.
//
// /!\ Les dates et le prix sont lus tels qu'ils ont ete figes a la
// souscription, jamais recalcules a partir de la formule (§9). Une salle qui
// augmente son tarif ne doit pas reecrire retroactivement ce que l'adherent a
// paye l'an dernier — il s'en souviendrait, lui.
//
// Aucun bouton pour souscrire : la vente se fait a l'accueil, encaissee par le
// staff. Le paiement en ligne est le Lot 6.
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { abonnementsEspace } from "@/lib/data/espace";
import { formatDate, formatFCFA } from "@/lib/utils/format";
import { joursRestants } from "@/lib/utils/duree";

export const metadata = { title: "Mes abonnements — Fitt" };

/* Traduction des statuts stockes en MAJUSCULES (§8). Les libelles sont ceux
   que comprend un adherent, pas ceux du back-office : "Termine" plutot
   qu'"Expire", qui sonne comme un reproche. */
const STATUTS = {
  ACTIF: { libelle: "En cours", ton: "succes" },
  EXPIRE: { libelle: "Termine", ton: "neutre" },
  ANNULE: { libelle: "Annule", ton: "danger" },
} as const;

export default async function PageAbonnements() {
  const abonnements = await abonnementsEspace();

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Mes abonnements"
        sousTitre="Votre formule en cours et son historique"
      />

      {abonnements.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<CreditCard className="size-6" />}
              titre="Aucun abonnement"
              description="Passez a l'accueil de votre salle pour souscrire. Votre formule apparaitra ici."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {abonnements.map((abonnement) => {
            const statut =
              STATUTS[abonnement.statut as keyof typeof STATUTS] ??
              STATUTS.EXPIRE;
            const enCours = abonnement.statut === "ACTIF";
            const jours = enCours ? joursRestants(abonnement.finLe) : null;

            return (
              <Card
                key={abonnement.id}
                className={enCours ? "border-brand/40" : undefined}
              >
                <CardBody className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink">
                        {abonnement.nomFormule}
                      </p>
                      <Badge ton={statut.ton}>{statut.libelle}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Du {formatDate(abonnement.debutLe)} au{" "}
                      {formatDate(abonnement.finLe)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-ink">
                      {formatFCFA(abonnement.prixPaye)}
                    </p>
                    {jours !== null && (
                      <p className="text-xs text-muted">
                        {jours > 1
                          ? `${jours} jours restants`
                          : jours === 1
                            ? "1 jour restant"
                            : "dernier jour"}
                      </p>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted">
        Pour renouveler, passez a l&apos;accueil de votre salle. Le montant
        affiche est celui qui a ete facture le jour de la souscription.
      </p>
    </div>
  );
}
