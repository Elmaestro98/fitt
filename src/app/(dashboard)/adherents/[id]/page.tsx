// Fiche adherent. Structure reprise de public/fichemembre.png : colonne
// d'identite a gauche, abonnement / paiements / presences a droite.
//
// Les trois cartes de droite dependent de tables qui n'existent pas encore.
// Elles sont dessinees comme des emplacements annonces, jamais remplies de
// fausses donnees.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Pencil, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CarteAVenir } from "@/components/ui/carte-a-venir";
import { PageHeader } from "@/components/layout/page-header";
import { CarteIdentite } from "@/components/adherents/carte-identite";
import { ActionsStatut } from "@/components/adherents/actions-statut";
import { trouverAdherent } from "@/lib/data/adherent";
import {
  abonnementActuel,
  listerAbonnementsAdherent,
  synchroniserExpirations,
} from "@/lib/data/abonnement";
import { CarteAbonnement } from "@/components/abonnements/carte-abonnement";
import { HistoriqueAbonnements } from "@/components/abonnements/historique-abonnements";

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

  const [actuel, historique] = await Promise.all([
    abonnementActuel(id),
    listerAbonnementsAdherent(id),
  ]);

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

          <CarteAVenir
            titre="Code d'acces"
            lot={1}
            hauteur="h-36"
            description="Le QR code de l'adherent arrivera avec le pointage. Il sera genere par la salle, sans que l'adherent ait a activer son espace."
          />
        </div>

        <div className="space-y-5 lg:col-span-2">
          <CarteAbonnement adherentId={adherent.id} abonnement={actuel} />

          <HistoriqueAbonnements abonnements={historique} />

          <CarteAVenir
            titre="Historique des paiements"
            lot={1}
            description="Date, montant en FCFA, methode (Wave, Orange Money, especes) et statut. Un paiement ne sera jamais supprime, seulement annule avec motif."
          />

          {adherent.notes ? (
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
          ) : (
            <CarteAVenir
              titre="Presences"
              lot={1}
              hauteur="h-32"
              description="Historique des passages sur les trois derniers mois, et nombre total de seances."
            />
          )}
        </div>
      </div>
    </div>
  );
}
