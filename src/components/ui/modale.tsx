"use client";

// Modale du design system. Composant client : elle ecoute le clavier.
//
// Sur telephone elle remonte du bas de l'ecran et occupe toute la largeur
// (le back-office est utilise a l'accueil, a une main, §11) ; sur grand ecran
// elle se centre.
import { useEffect } from "react";
import { X } from "lucide-react";

export function Modale({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  children,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
}) {
  // Fermeture au clavier + blocage du defilement de la page derriere.
  // Une modale qui ne se ferme pas avec Echap piege l'utilisateur.
  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", surTouche);

    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = defilement;
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  const idTitre = `modale-${titre.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div
      // Le voile monte en fondu. Sans lui, la page derriere s'assombrit d'un
      // coup et l'oeil perd le fil de ce qu'il regardait.
      className={
        "fixed inset-0 z-50 flex items-end justify-center overflow-y-auto " +
        "bg-ink/40 backdrop-blur-[2px] animate-voile sm:items-center sm:p-4"
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      {/* Deux entrees differentes, et c'est voulu :
          - sur telephone, le panneau REMONTE du bas, comme une feuille que
            l'on tire — le geste correspond a la position du pouce ;
          - sur grand ecran, il surgit au centre avec un leger depassement.
          Meme composant, deux gestes justes. */}
      <div
        className={
          "w-full max-w-md rounded-t-card bg-surface shadow-flottant " +
          "animate-remonter sm:animate-surgir sm:rounded-card"
        }
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitre} className="display font-semibold text-ink">
              {titre}
            </h2>
            {sousTitre && (
              <p className="mt-0.5 truncate text-sm text-muted">{sousTitre}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className={
              "-mt-1 flex size-9 shrink-0 items-center justify-center rounded-control " +
              "text-muted transition-[color,background-color,transform] " +
              "duration-[var(--duree-instant)] ease-sortie " +
              "hover:rotate-90 hover:bg-sunken hover:text-ink"
            }
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
