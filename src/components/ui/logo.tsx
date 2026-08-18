// Primitive reutilisable (CLAUDE.md §7 : components/ui/).
// Un seul endroit connait le fichier et son ratio : si le logo change un jour,
// on ne touche qu'ici.
import Image from "next/image";

// Dimensions reelles du fichier public/logo-fitt.png
const LARGEUR_SOURCE = 354;
const HAUTEUR_SOURCE = 120;
const RATIO = LARGEUR_SOURCE / HAUTEUR_SOURCE;

type LogoProps = {
  /** Hauteur affichee en pixels. La largeur suit automatiquement le ratio. */
  hauteur?: number;
  /** A activer pour le logo visible des le premier ecran (evite le clignotement). */
  prioritaire?: boolean;
  className?: string;
};

export function Logo({
  hauteur = 32,
  prioritaire = false,
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/logo-fitt.png"
      // Le logo porte le nom de la marque : le texte alternatif doit le dire,
      // pour les lecteurs d'ecran comme pour le referencement.
      alt="Fitt"
      width={Math.round(hauteur * RATIO)}
      height={hauteur}
      priority={prioritaire}
      className={className}
    />
  );
}
