// Liens d'inscription et demandes en attente.
//
// Sous-page des adherents plutot qu'entree de menu : inviter, c'est une
// facon d'ajouter un adherent, pas un domaine a part.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireLien } from "@/components/invitations/formulaire-lien";
import { TableLiens } from "@/components/invitations/table-liens";
import { DemandesEnAttente } from "@/components/invitations/demandes-en-attente";
import { listerLiens, preinscriptionsEnAttente } from "@/lib/data/invitation";

export const metadata = { title: "Inviter des adherents — Fitt" };

export default async function PageInvitations() {
  const [liens, demandes] = await Promise.all([
    listerLiens(),
    preinscriptionsEnAttente(),
  ]);

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
        <span className="text-ink">Inviter</span>
      </nav>

      <PageHeader
        titre="Inviter des adherents"
        sousTitre="Laissez vos adherents saisir eux-memes leurs informations"
      />

      {/* Les demandes en premier : c'est ce qui appelle une action. */}
      <DemandesEnAttente demandes={demandes} />

      <FormulaireLien />

      <Card className="overflow-hidden">
        <TableLiens liens={liens} />
      </Card>

      <p className="text-xs text-muted">
        Un lien ne cree jamais de compte : il remplit une fiche, que votre
        equipe valide. Une salle dont personne n&apos;utilise ces liens
        fonctionne exactement pareil.
      </p>
    </div>
  );
}
