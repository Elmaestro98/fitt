import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireProduit } from "@/components/produits/formulaire-produit";
import { actionModifierProduit } from "@/lib/actions/produit";
import { trouverProduit } from "@/lib/data/produit";

export const metadata = { title: "Modifier un produit — Fitt" };

export default async function PageModifierProduit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produit = await trouverProduit(id);
  if (!produit) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/boutique"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la boutique
      </Link>

      <PageHeader titre={produit.nom} sousTitre="Modifier le produit" />

      <FormulaireProduit
        action={actionModifierProduit.bind(null, produit.id)}
        valeurs={produit}
        libelleSoumission="Enregistrer les modifications"
        avertissementPrix
      />
    </div>
  );
}
