// La boutique de la salle, vue par l'adherent.
//
// Le paiement se fait sur place, a la recuperation (decision du 21/08/2026) :
// cette page n'encaisse rien et ne demande aucune coordonnee bancaire. Elle
// enregistre une intention d'achat, que le staff honore au comptoir.
import { ShoppingBag } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogueBoutique } from "@/components/espace/catalogue-boutique";
import { catalogueEspace } from "@/lib/data/espace-boutique";

export const metadata = { title: "Boutique — Fitt" };

export default async function PageBoutiqueEspace() {
  const produits = await catalogueEspace();

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Boutique"
        sousTitre="Commandez ici, reglez et recuperez a la salle"
      />

      {produits.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<ShoppingBag className="size-6" />}
              titre="Boutique vide"
              description="Votre salle n'a encore mis aucun produit en vente. Revenez plus tard."
            />
          </CardBody>
        </Card>
      ) : (
        <CatalogueBoutique produits={produits} />
      )}
    </div>
  );
}
