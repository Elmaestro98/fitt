import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireProduit } from "@/components/produits/formulaire-produit";
import { actionCreerProduit } from "@/lib/actions/produit";

export const metadata = { title: "Nouveau produit — Fitt" };

export default function PageNouveauProduit() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/boutique"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la boutique
      </Link>

      <PageHeader
        titre="Nouveau produit"
        sousTitre="Le nom et le prix seront copies dans chaque commande passee."
      />

      <FormulaireProduit
        action={actionCreerProduit}
        libelleSoumission="Creer le produit"
      />
    </div>
  );
}
