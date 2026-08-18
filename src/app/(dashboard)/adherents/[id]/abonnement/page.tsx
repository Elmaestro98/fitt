import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireSouscription } from "@/components/abonnements/formulaire-souscription";
import { actionSouscrire } from "@/lib/actions/abonnement";
import { abonnementActuel, debutProposePour } from "@/lib/data/abonnement";
import { trouverAdherent } from "@/lib/data/adherent";
import { listerFormules } from "@/lib/data/formule";

export const metadata = { title: "Souscrire un abonnement — Fitt" };

export default async function PageSouscription({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const adherent = await trouverAdherent(id);
  if (!adherent) notFound();

  const [formules, actuel, debut] = await Promise.all([
    listerFormules(), // actives uniquement : on ne vend pas une offre archivee
    abonnementActuel(id),
    debutProposePour(id),
  ]);

  const nomComplet = `${adherent.prenom} ${adherent.nom}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/adherents/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la fiche
      </Link>

      <PageHeader
        titre={actuel ? "Renouveler l'abonnement" : "Souscrire un abonnement"}
        sousTitre={`${nomComplet} · ${adherent.numero}`}
      />

      {formules.length === 0 ? (
        <Card>
          <EmptyState
            icone={<Tag className="size-5" />}
            titre="Aucune formule active"
            description="Creez au moins une formule avant de pouvoir souscrire un abonnement."
            action={
              <Link href="/formules/nouvelle">
                <Button>Creer une formule</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <FormulaireSouscription
          // .bind : l'adherentId ne passe pas par le formulaire.
          action={actionSouscrire.bind(null, id)}
          formules={formules}
          debutPropose={debut.toISOString().slice(0, 10)}
          prolongation={Boolean(actuel)}
          hrefAnnuler={`/adherents/${id}`}
        />
      )}
    </div>
  );
}
