"use client";

// Catalogue + panier de l'espace adherent.
//
// Le panier vit UNIQUEMENT dans cet etat React, jamais en base : tant que
// l'adherent n'a pas valide, il n'y a rien a conserver — et une table
// "panier" a maintenir, a purger et a synchroniser entre deux telephones
// serait un cout permanent pour un gain nul.
//
// /!\ Le panier n'envoie que des identifiants et des quantites. Les prix
// affiches ici sont de l'information ; ceux qui font foi sont relus en base
// par passerCommande (§9). Rien de ce qui touche a l'argent ne se decide dans
// le navigateur.
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire } from "@/components/ui/form";
import { actionPasserCommande } from "@/lib/actions/espace-boutique";
import { formatFCFA } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Produit = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  photoUrl: string | null;
};

/** Doit rester aligne sur QUANTITE_MAX de data/espace-boutique.ts : le serveur
 *  refuserait un panier que cet ecran aurait laisse constituer. */
const QUANTITE_MAX = 20;

export function CatalogueBoutique({ produits }: { produits: Produit[] }) {
  const router = useRouter();
  const [panier, setPanier] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [envoyee, setEnvoyee] = useState(false);
  const [enCours, demarrer] = useTransition();

  const { articles, total } = useMemo(() => {
    let articles = 0;
    let total = 0;
    for (const produit of produits) {
      const quantite = panier[produit.id] ?? 0;
      articles += quantite;
      total += quantite * produit.prix;
    }
    return { articles, total };
  }, [panier, produits]);

  function ajuster(produitId: string, delta: number) {
    setMessage(null);
    setPanier((precedent) => {
      const suivant = { ...precedent };
      const quantite = (suivant[produitId] ?? 0) + delta;

      if (quantite <= 0) delete suivant[produitId];
      else suivant[produitId] = Math.min(quantite, QUANTITE_MAX);

      return suivant;
    });
  }

  function commander() {
    setMessage(null);
    const lignes = Object.entries(panier).map(([produitId, quantite]) => ({
      produitId,
      quantite,
    }));

    demarrer(async () => {
      const resultat = await actionPasserCommande(JSON.stringify(lignes));

      if (resultat.succes) {
        setEnvoyee(true);
        setPanier({});
        router.refresh();
        return;
      }

      setMessage(resultat.message ?? "La commande a echoue.");
    });
  }

  if (envoyee) {
    return (
      <Card>
        <CardBody className="space-y-3 py-10 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft">
            <Check className="size-7 text-success" />
          </span>
          <p className="font-semibold text-ink">Commande enregistree</p>
          <p className="mx-auto max-w-xs text-sm text-muted">
            La salle la prepare. Vous reglerez sur place au moment de la
            recuperer.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variante="contour"
              onClick={() => setEnvoyee(false)}
            >
              Commander autre chose
            </Button>
            <Button type="button" onClick={() => router.push("/espace/commandes")}>
              Voir mes commandes
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && <AlerteFormulaire>{message}</AlerteFormulaire>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {produits.map((produit) => {
          const quantite = panier[produit.id] ?? 0;

          return (
            <Card
              key={produit.id}
              className={cn(quantite > 0 && "border-brand")}
            >
              <CardBody className="flex h-full flex-col gap-3 py-4">
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
                    <p className="font-medium text-ink">{produit.nom}</p>
                    {produit.description && (
                      <p className="mt-0.5 text-sm text-muted">
                        {produit.description}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-lg font-bold text-ink">
                  {formatFCFA(produit.prix)}
                </p>

                <div className="mt-auto pt-1">
                  {quantite === 0 ? (
                    <Button
                      type="button"
                      variante="contour"
                      onClick={() => ajuster(produit.id, 1)}
                      className="h-11 w-full"
                    >
                      <Plus className="size-4" />
                      Ajouter
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-control bg-sunken p-1">
                      <button
                        type="button"
                        onClick={() => ajuster(produit.id, -1)}
                        aria-label={`Retirer un ${produit.nom}`}
                        className="flex size-11 items-center justify-center rounded-control text-ink hover:bg-surface"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span
                        className="font-semibold text-ink tabular-nums"
                        aria-live="polite"
                      >
                        {quantite}
                      </span>
                      <button
                        type="button"
                        onClick={() => ajuster(produit.id, 1)}
                        disabled={quantite >= QUANTITE_MAX}
                        aria-label={`Ajouter un ${produit.nom}`}
                        className="flex size-11 items-center justify-center rounded-control text-ink hover:bg-surface disabled:opacity-40"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Barre de validation collee au bas de l'ecran : sur telephone, le
          panier doit rester atteignable au pouce sans remonter la page (§11). */}
      {articles > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted">
                {articles} article{articles > 1 ? "s" : ""}
              </p>
              <p className="text-lg font-bold text-ink">{formatFCFA(total)}</p>
            </div>

            <Button
              type="button"
              onClick={commander}
              disabled={enCours}
              className="h-12 shrink-0"
            >
              {enCours ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              {enCours ? "Envoi..." : "Commander"}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted">
            Vous reglerez a la salle en recuperant votre commande.
          </p>
        </div>
      )}
    </div>
  );
}
