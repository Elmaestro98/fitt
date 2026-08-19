// Fiche adherent. Structure reprise de public/fichemembre.png : colonne
// d'identite a gauche, abonnement / paiements / presences a droite.
//
// Toutes les cartes sont branchees sur leurs vraies tables : abonnement,
// paiements, presences, et l'acces a l'espace adherent. Aucune n'est remplie
// de fausses donnees.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Pencil, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CarteIdentite } from "@/components/adherents/carte-identite";
import { ActionsStatut } from "@/components/adherents/actions-statut";
import { CarteEspace } from "@/components/adherents/carte-espace";
import { etatEspaceAdherent } from "@/lib/data/espace-adherent";
import { trouverAdherent } from "@/lib/data/adherent";
import {
  abonnementActuel,
  listerAbonnementsAdherent,
  synchroniserExpirations,
} from "@/lib/data/abonnement";
import { CarteAbonnement } from "@/components/abonnements/carte-abonnement";
import { HistoriqueAbonnements } from "@/components/abonnements/historique-abonnements";
import { CartePaiements } from "@/components/paiements/carte-paiements";
import { paiementsAdherent, soldeAbonnement } from "@/lib/data/paiement";
import { CartePresences } from "@/components/pointage/carte-presences";
import { pointagesAdherent } from "@/lib/data/pointage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adherent = await trouverAdherent(id);
  return {
    title: adherent
      ? `${adherent.prenom} ${adherent.nom} — Fitt`
      : "Adherent introuvable — Fitt",
  };
}

export default async function PageFicheAdherent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // trouverAdherent filtre deja sur le gymId de la session : l'id d'un
  // adherent d'une autre salle renvoie null, donc un 404. Le gerant ne peut
  // pas deviner l'existence d'une fiche qui ne lui appartient pas.
  // Met a jour les statuts echus avant de lire : sans cela un abonnement
  // termine hier s'afficherait encore comme "en cours".
  // Lot 2 : deplacer dans une tache planifiee quotidienne.
  await synchroniserExpirations();

  const adherent = await trouverAdherent(id);
  if (!adherent) notFound();

  const [actuel, historique, paiements, presences, espace] = await Promise.all([
    abonnementActuel(id),
    listerAbonnementsAdherent(id),
    paiementsAdherent(id),
    pointagesAdherent(id),
    etatEspaceAdherent(id),
  ]);

  // Le solde depend de l'abonnement en cours : on ne peut le demander qu'une
  // fois celui-ci connu.
  const solde = actuel ? await soldeAbonnement(actuel.id) : null;

  const nomComplet = `${adherent.prenom} ${adherent.nom}`;

  return (
    <div className="space-y-5">
      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center gap-1 text-sm text-muted"
      >
        <Link href="/adherents" className="hover:text-ink">
          Adherents
        </Link>
        <ChevronRight className="size-4" />
        <span className="truncate text-ink">{nomComplet}</span>
      </nav>

      <PageHeader
        titre="Fiche adherent"
        sousTitre={adherent.numero}
        action={
          <Link href={`/adherents/${adherent.id}/modifier`}>
            <Button variante="contour">
              <Pencil className="size-4" />
              Modifier
            </Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-1">
          <CarteIdentite adherent={adherent} />

          <Card>
            <CardBody className="pt-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">Actions</h2>
              <ActionsStatut id={adherent.id} statut={adherent.statut} />
            </CardBody>
          </Card>

          <CarteEspace
            adherentId={adherent.id}
            etat={espace}
            // Un adherent en attente de validation n'a pas d'espace (§4), un
            // archive n'en a plus.
            invitable={
              adherent.statut !== "EN_ATTENTE_VALIDATION" &&
              adherent.statut !== "ARCHIVE"
            }
          />
        </div>

        <div className="space-y-5 lg:col-span-2">
          <CarteAbonnement adherentId={adherent.id} abonnement={actuel} />

          <HistoriqueAbonnements abonnements={historique} />

          <CartePaiements
            adherentId={adherent.id}
            nomAdherent={nomComplet}
            abonnement={
              actuel && solde
                ? {
                    id: actuel.id,
                    nomFormule: actuel.nomFormule,
                    reste: solde.reste,
                  }
                : null
            }
            solde={solde}
            paiements={paiements}
          />

          <CartePresences
            passages={presences.passages}
            total={presences.total}
          />

          {adherent.notes && (
            <Card>
              <CardHeader
                titre="Notes internes"
                icone={<StickyNote className="size-4 text-muted" />}
              />
              <CardBody>
                <p className="text-sm whitespace-pre-line text-ink">
                  {adherent.notes}
                </p>
                <p className="mt-3 text-xs text-muted">
                  Visible par l&apos;equipe uniquement.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
