import Image from "next/image";
import Link from "next/link";
import { Archive, Package, Pencil, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils/format";
import { actionBasculerArchivageProduit } from "@/lib/actions/produit";
import { cn } from "@/lib/utils/cn";

type Produit = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  photoUrl: string | null;
  actif: boolean;
  _count: { lignesCommande: number };
};

export function CarteProduit({ produit }: { produit: Produit }) {
  // Toutes commandes confondues, annulees comprises : ce compteur ne mesure
  // pas le chiffre d'affaires, il dit pourquoi ce produit ne peut plus etre
  // supprime (§9) — chaque ligne le cite, quel que soit le sort de sa
  // commande. Le vrai suivi des ventes vit dans /rapports.
  const commandes = produit._count.lignesCommande;

  return (
    <Card className={cn(!produit.actif && "border-dashed bg-canvas")}>
      <CardBody className="space-y-4 pt-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-control bg-sunken">
            {produit.photoUrl ? (
              <Image
                src={produit.photoUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 object-cover"
              />
            ) : (
              <Package className="size-5 text-muted" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "font-semibold",
                  produit.actif ? "text-ink" : "text-muted",
                )}
              >
                {produit.nom}
              </h3>
              {!produit.actif && <Badge ton="neutre">Archive</Badge>}
            </div>
            {produit.description && (
              <p className="mt-0.5 text-sm text-muted">{produit.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-bold",
              produit.actif ? "text-ink" : "text-muted",
            )}
          >
            {formatFCFA(produit.prix)}
          </span>
        </div>

        <p className="text-xs text-muted">
          {commandes === 0
            ? "Jamais commande"
            : `Dans ${commandes} commande${commandes > 1 ? "s" : ""}`}
        </p>

        <div className="flex gap-2 border-t border-line pt-4">
          <Link href={`/boutique/${produit.id}/modifier`} className="flex-1">
            <Button variante="contour" taille="sm" className="w-full">
              <Pencil className="size-4" />
              Modifier
            </Button>
          </Link>

          {/* Aucun bouton "Supprimer" : un produit s'archive (§9). */}
          <form action={actionBasculerArchivageProduit} className="flex-1">
            <input type="hidden" name="id" value={produit.id} />
            <input
              type="hidden"
              name="actif"
              value={produit.actif ? "false" : "true"}
            />
            <Button
              type="submit"
              variante={produit.actif ? "fantome" : "contour"}
              taille="sm"
              className="w-full"
            >
              {produit.actif ? (
                <>
                  <Archive className="size-4" />
                  Archiver
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Remettre en vente
                </>
              )}
            </Button>
          </form>
        </div>
      </CardBody>
    </Card>
  );
}
