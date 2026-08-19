import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ImporterAdherents } from "@/components/adherents/importer-adherents";

export const metadata = { title: "Importer des adherents — Fitt" };

export default function PageImporterAdherents() {
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
        titre="Importer des adherents"
        sousTitre="Depuis un fichier CSV exporte d'Excel ou de votre ancien carnet."
      />

      <ImporterAdherents />
    </div>
  );
}
