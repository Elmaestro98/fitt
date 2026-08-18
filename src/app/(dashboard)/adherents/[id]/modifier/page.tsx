import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireAdherent } from "@/components/adherents/formulaire-adherent";
import { actionModifierAdherent } from "@/lib/actions/adherent";
import { trouverAdherent } from "@/lib/data/adherent";

export const metadata = { title: "Modifier un adherent — Fitt" };

export default async function PageModifierAdherent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Filtre sur le gymId de la session : l'id d'une autre salle donne un 404.
  const adherent = await trouverAdherent(id);
  if (!adherent) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/adherents/${adherent.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la fiche
      </Link>

      <PageHeader
        titre={`${adherent.prenom} ${adherent.nom}`}
        sousTitre={`${adherent.numero} · le numero et le statut ne se modifient pas ici`}
      />

      <FormulaireAdherent
        // .bind fige l'id cote serveur : il n'apparait nulle part dans le
        // HTML envoye au navigateur, donc personne ne peut le remplacer.
        action={actionModifierAdherent.bind(null, adherent.id)}
        valeurs={adherent}
        libelleSoumission="Enregistrer les modifications"
        hrefAnnuler={`/adherents/${adherent.id}`}
      />
    </div>
  );
}
