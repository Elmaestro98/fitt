import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireCoach } from "@/components/coachs/formulaire-coach";
import { actionCreerCoach } from "@/lib/actions/coach";

export const metadata = { title: "Nouveau coach — Fitt" };

export default function PageNouveauCoach() {
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
        titre="Nouveau coach"
        sousTitre="Il pourra ensuite etre assigne a des seances de cours."
      />

      <FormulaireCoach
        action={actionCreerCoach}
        libelleSoumission="Creer le coach"
      />
    </div>
  );
}
