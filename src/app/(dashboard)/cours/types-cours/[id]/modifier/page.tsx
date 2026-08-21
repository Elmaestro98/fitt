import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireTypeCours } from "@/components/types-cours/formulaire-type-cours";
import { actionModifierTypeCours } from "@/lib/actions/type-cours";
import { trouverTypeCours } from "@/lib/data/type-cours";

export const metadata = { title: "Modifier un type de cours — Fitt" };

export default async function PageModifierTypeCours({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const typeCours = await trouverTypeCours(id);
  if (!typeCours) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/cours/types-cours"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour aux types de cours
      </Link>

      <PageHeader titre={typeCours.nom} sousTitre="Modifier le type de cours" />

      <FormulaireTypeCours
        action={actionModifierTypeCours.bind(null, typeCours.id)}
        valeurs={typeCours}
        libelleSoumission="Enregistrer les modifications"
        avertissement
      />
    </div>
  );
}
