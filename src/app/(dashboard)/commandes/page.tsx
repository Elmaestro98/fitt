// Les commandes de la boutique, cote staff.
//
// Deux vues seulement : ce qu'il reste a traiter (par defaut), et tout
// l'historique. Pas de recherche ni de pagination pour l'instant — une salle
// de 80 a 400 adherents ne genere pas un volume qui l'exige. A ajouter le jour
// ou la liste depasse 50 lignes (§7).
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CarteCommande } from "@/components/commandes/carte-commande";
import {
  compterCommandesATraiter,
  listerCommandes,
  type FiltreCommandes,
} from "@/lib/data/commande";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Commandes — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PageCommandes({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  // Vient de l'URL, donc pas fiable tel quel : tout ce qui n'est pas
  // exactement "toutes" retombe sur la vue par defaut.
  const filtre: FiltreCommandes =
    params.vue === "toutes" ? "toutes" : "en_cours";

  // Le compteur est lu meme sur l'historique : le staff doit voir qu'il reste
  // des commandes a preparer sans avoir a revenir sur l'autre onglet.
  const [commandes, aTraiter] = await Promise.all([
    listerCommandes(filtre),
    compterCommandesATraiter(),
  ]);
  const enCours = filtre === "en_cours";

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Commandes"
        sousTitre={
          enCours
            ? "Les commandes a preparer et a remettre"
            : "Toutes les commandes de la boutique"
        }
        action={
          <Link href="/boutique">
            <Button variante="contour">Gerer le catalogue</Button>
          </Link>
        }
      />

      <div className="flex gap-2">
        <Onglet href="/commandes" actif={enCours}>
          A traiter
          {aTraiter > 0 && (
            <span
              className={cn(
                "ml-2 rounded-pill px-2 py-0.5 text-xs tabular-nums",
                enCours ? "bg-white/20" : "bg-brand-soft text-brand",
              )}
            >
              {aTraiter}
            </span>
          )}
        </Onglet>
        <Onglet href="/commandes?vue=toutes" actif={!enCours}>
          Historique
        </Onglet>
      </div>

      {commandes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<ShoppingBag className="size-6" />}
              titre={enCours ? "Rien a preparer" : "Aucune commande"}
              description={
                enCours
                  ? "Toutes les commandes ont ete traitees. Les nouvelles apparaitront ici des qu'un adherent commande depuis son espace."
                  : "Aucun adherent n'a encore commande. Verifiez que votre catalogue contient des produits en vente."
              }
              action={
                <Link href="/boutique">
                  <Button variante="contour">Gerer le catalogue</Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <CarteCommande key={commande.id} commande={commande} />
          ))}
        </div>
      )}
    </div>
  );
}

function Onglet({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-control px-4 text-sm font-medium",
        actif
          ? "bg-brand text-white"
          : "bg-surface text-muted border border-line hover:bg-sunken hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
