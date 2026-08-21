import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireTypeCours } from "@/components/types-cours/formulaire-type-cours";
import { actionCreerTypeCours } from "@/lib/actions/type-cours";

export const metadata = { title: "Nouveau type de cours — Fitt" };

export default function PageNouveauTypeCours() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/cours/types-cours"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour aux types de cours
      </Link>

      <PageHeader
        titre="Nouveau type de cours"
        sousTitre="La duree et la capacite seront proposees par defaut a chaque seance."
      />

      <FormulaireTypeCours
        action={actionCreerTypeCours}
        libelleSoumission="Creer le type de cours"
      />
    </div>
  );
}
