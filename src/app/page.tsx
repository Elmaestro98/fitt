// Page publique, accessible sans connexion (declaree dans src/middleware.ts).
// Provisoire quant au CONTENU : la vraie landing viendra avec sa maquette.
// La mise en scene, elle, est definitive — c'est le premier ecran que voit un
// gerant a qui l'on montre Fitt, et un premier ecran fade coute une demo.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function PageAccueil() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sidebar px-6 text-center">
      <FondAnime />

      <div className="cascade relative flex flex-col items-center gap-8">
        <Logo hauteur={56} prioritaire />

        <div className="max-w-xl">
          {/* Le titre est le seul endroit du produit ou l'on se permet une
              vraie echelle typographique. Police display, interlettrage
              resserre : a cette taille, l'espacement par defaut ferait
              flotter les mots. */}
          <h1 className="display text-3xl font-bold tracking-tight text-balance text-white sm:text-5xl">
            La gestion de votre salle,{" "}
            <span className="text-brand">sans carnet</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-sidebar-text">
            Adherents, abonnements, paiements et pointage — au meme endroit,
            depuis votre telephone comme depuis l&apos;accueil.
          </p>
        </div>

        <Link href="/connexion" className="group">
          <Button taille="lg">
            Acceder a mon espace
            {/* La fleche avance a l'approche du curseur : elle annonce le
                depart vers un autre ecran. */}
            <ArrowRight className="size-4 transition-transform duration-[var(--duree-courte)] ease-sortie group-hover:translate-x-1" />
          </Button>
        </Link>

        <p className="text-xs text-sidebar-text">
          Edite par AFRICATECHNOLOGIE — Saint-Louis, Senegal
        </p>
      </div>
    </div>
  );
}

/**
 * Decor de fond : une grille fine et deux halos orange qui respirent
 * lentement.
 *
 * Trois precautions, sinon c'est joli deux secondes puis penible :
 * - aria-hidden et pointer-events-none : ce n'est pas du contenu, ca ne doit
 *   ni etre lu par un lecteur d'ecran ni intercepter un clic ;
 * - des opacites tres basses : le decor doit se remarquer sans se regarder ;
 * - une animation de 12 secondes, coupee par prefers-reduced-motion (la regle
 *   globale de globals.css s'en charge). Un fond qui pulse vite donne mal a
 *   la tete au bout d'une minute.
 */
function FondAnime() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Grille technique, tres pale. Deux degrades repetes valent mieux
          qu'une image : aucun fichier a telecharger. */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Halo orange en haut a gauche, halo froid en bas a droite : ils
          donnent de la profondeur a un aplat qui, sinon, serait plat. */}
      <div className="animate-halo absolute -top-32 -left-24 size-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="animate-halo absolute -right-24 -bottom-32 size-96 rounded-full bg-info/20 blur-3xl [animation-delay:-6s]" />
    </div>
  );
}
