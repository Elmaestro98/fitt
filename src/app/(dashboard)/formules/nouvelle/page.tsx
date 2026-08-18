import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireFormule } from "@/components/formules/formulaire-formule";
import { actionCreerFormule } from "@/lib/actions/formule";

export const metadata = { title: "Nouvelle formule — Fitt" };

export default function PageNouvelleFormule() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/formules"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour aux formules
      </Link>

      <PageHeader
        titre="Nouvelle formule"
        sousTitre="Le prix et la duree seront copies dans chaque abonnement souscrit."
      />

      <FormulaireFormule
        action={actionCreerFormule}
        libelleSoumission="Creer la formule"
      />
    </div>
  );
}
