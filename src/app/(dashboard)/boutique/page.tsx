import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CarteProduit } from "@/components/produits/carte-produit";
import { listerProduits } from "@/lib/data/produit";

export const metadata = { title: "Boutique — Fitt" };

export default async function PageBoutique() {
  // On affiche aussi les archives : le gerant doit pouvoir les retrouver et
  // les remettre en vente, et comprendre pourquoi une ancienne commande les
  // cite.
  const produits = await listerProduits({ inclureArchives: true });
  const actifs = produits.filter((p) => p.actif).length;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Boutique"
        sousTitre={
          produits.length === 0
            ? "Les produits que vos adherents peuvent commander"
            : `${actifs} produit${actifs > 1 ? "s" : ""} en vente sur ${produits.length}`
        }
        action={
          <Link href="/boutique/nouveau">
            <Button>
              <Plus className="size-4" />
              Nouveau produit
            </Button>
          </Link>
        }
      />

      {produits.length === 0 ? (
        <Card>
          <EmptyState
            icone={<ShoppingBag className="size-5" />}
            titre="Aucun produit"
            description="Ajoutez vos compléments, textiles ou accessoires. Ils seront visibles par vos adherents, qui pourront les commander et venir les recuperer en salle."
            action={
              <Link href="/boutique/nouveau">
                <Button>
                  <Plus className="size-4" />
                  Nouveau produit
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {produits.map((p) => (
            <CarteProduit key={p.id} produit={p} />
          ))}
        </div>
      )}
    </div>
  );
}
