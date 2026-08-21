import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireCoach } from "@/components/coachs/formulaire-coach";
import { actionModifierCoach } from "@/lib/actions/coach";
import { trouverCoach } from "@/lib/data/coach";

export const metadata = { title: "Modifier un coach — Fitt" };

export default async function PageModifierCoach({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await trouverCoach(id);
  if (!coach) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/cours/coachs"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour aux coachs
      </Link>

      <PageHeader
        titre={`${coach.prenom} ${coach.nom}`}
        sousTitre="Modifier le coach"
      />

      <FormulaireCoach
        action={actionModifierCoach.bind(null, coach.id)}
        valeurs={coach}
        libelleSoumission="Enregistrer les modifications"
      />
    </div>
  );
}
