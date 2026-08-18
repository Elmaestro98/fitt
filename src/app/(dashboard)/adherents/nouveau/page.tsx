import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireAdherent } from "@/components/adherents/formulaire-adherent";

export const metadata = { title: "Nouvel adherent — Fitt" };

export default function PageNouvelAdherent() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/adherents"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la liste
      </Link>

      <PageHeader
        titre="Nouvel adherent"
        sousTitre="Seuls le prenom, le nom et le telephone sont obligatoires."
      />

      <FormulaireAdherent />
    </div>
  );
}
