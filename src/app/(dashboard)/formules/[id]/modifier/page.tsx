import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireFormule } from "@/components/formules/formulaire-formule";
import { actionModifierFormule } from "@/lib/actions/formule";
import { trouverFormule } from "@/lib/data/formule";

export const metadata = { title: "Modifier une formule — Fitt" };

export default async function PageModifierFormule({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formule = await trouverFormule(id);
  if (!formule) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/formules"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour aux formules
      </Link>

      <PageHeader titre={formule.nom} sousTitre="Modifier la formule" />

      <FormulaireFormule
        action={actionModifierFormule.bind(null, formule.id)}
        valeurs={formule}
        libelleSoumission="Enregistrer les modifications"
        avertissementPrix
      />
    </div>
  );
}
