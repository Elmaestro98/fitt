// Page servie par le service worker quand une navigation echoue faute de
// reseau (public/sw.js).
//
// /!\ Elle doit rester ENTIEREMENT statique : aucune lecture de base, aucun
// appel a getTenantContext(). C'est justement la page qui s'affiche quand
// plus rien n'est joignable — si elle avait besoin du serveur pour se rendre,
// elle ne s'afficherait jamais.
//
// Elle ne dit pas seulement "pas de reseau" : elle rappelle ce qui continue
// de fonctionner. A l'accueil d'une salle, savoir que les passages sont
// toujours enregistres (§9) evite de renvoyer les gens chez eux.
import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Hors ligne — Fitt" };

export default function PageHorsLigne() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sidebar px-6 text-center">
      <div className="cascade flex max-w-md flex-col items-center gap-6">
        <Logo hauteur={40} prioritaire />

        <span className="flex size-16 items-center justify-center rounded-full bg-white/5">
          <CloudOff className="size-7 text-brand" />
        </span>

        <div>
          <h1 className="display text-2xl font-bold tracking-tight text-white">
            Pas de connexion
          </h1>
          <p className="mt-3 text-sm text-sidebar-text">
            Fitt ne parvient pas a joindre le serveur. Verifiez le reseau,
            puis reessayez.
          </p>
        </div>

        <div className="rounded-card border border-white/10 bg-white/5 p-4 text-left">
          <p className="text-sm font-medium text-white">
            Le pointage, lui, continue
          </p>
          <p className="mt-1 text-sm text-sidebar-text">
            Les passages enregistres a la borne sont conserves sur cet appareil
            et partent seuls des le retour du reseau. Personne n&apos;est
            bloque a l&apos;entree.
          </p>
        </div>

        {/* Un lien, pas un bouton avec du JavaScript : cette page doit
            fonctionner meme si le script principal n'a jamais ete telecharge. */}
        <Link href="/" prefetch={false}>
          <Button variante="contour">
            <RefreshCw className="size-4" />
            Reessayer
          </Button>
        </Link>
      </div>
    </div>
  );
}
