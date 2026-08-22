"use client";

// Modale du design system. Composant client : elle ecoute le clavier.
//
// Sur telephone elle remonte du bas de l'ecran et occupe toute la largeur
// (le back-office est utilise a l'accueil, a une main, §11) ; sur grand ecran
// elle se centre.
import { useEffect } from "react";
import { createPortal } from "react-dom";
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

  // Portail vers <body>. Ce n'est pas un raffinement : "position: fixed" se
  // cale sur la fenetre UNIQUEMENT si aucun ancetre ne porte de transform, de
  // filter, de backdrop-filter, de perspective ni de contain. Le moindre de
  // ces styles, n'importe ou au-dessus, transforme la modale en element
  // prisonnier de cette zone-la. C'est exactement ce qui est arrive avec
  // <main class="animate-apparition"> (voir globals.css). En sortant du
  // <body>, la modale devient insensible a ce que fait la mise en page
  // au-dessus d'elle — aujourd'hui comme dans six mois.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      // Le voile monte en fondu. Sans lui, la page derriere s'assombrit d'un
      // coup et l'oeil perd le fil de ce qu'il regardait.
      //
      // /!\ PAS de overflow-y-auto ici. Le piege est classique : avec
      //     items-end (ou items-center), un panneau plus haut que l'ecran
      //     deborde par le HAUT, et cette partie-la est inatteignable au
      //     defilement — le navigateur ne remonte pas au-dela du bord de
      //     depart d'un element aligne en fin d'axe. Resultat, sur la modale
      //     d'encaissement (la plus haute du produit) le titre et les
      //     premiers champs disparaissaient sur telephone.
      //     C'est le PANNEAU qui defile, pas le voile.
      className={
        "fixed inset-0 z-50 flex items-end justify-center " +
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
          Meme composant, deux gestes justes.

          dvh et non vh : sur mobile, vh ignore la barre d'adresse du
          navigateur, donc le bas du panneau — les boutons — passait sous
          elle. */}
      <div
        className={
          "flex max-h-[92dvh] w-full max-w-md flex-col " +
          "rounded-t-card bg-surface shadow-flottant " +
          "animate-remonter sm:max-h-[85dvh] sm:animate-surgir sm:rounded-card"
        }
      >
        {/* shrink-0 : l'en-tete garde sa hauteur quoi qu'il arrive. Il reste
            visible pendant que le formulaire defile — on sait toujours dans
            quelle modale on se trouve. */}
        <header className="flex shrink-0 items-start justify-between gap-4 px-5 py-4">
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

        {/* min-h-0 est indispensable : sans lui, un enfant de flex refuse de
            devenir plus petit que son contenu (min-height: auto par defaut)
            et le overflow-y-auto ne s'active jamais.
            overscroll-contain empeche le defilement de « traverser » vers la
            page du dessous une fois arrive en bas.
            pb-safe : sur iPhone, la barre gestuelle du bas mangeait le bouton
            « Enregistrer le paiement ». */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
          // Marge basse en CSS nature plutot qu'en classe Tailwind : calc()
          // exige des espaces autour du +, que la syntaxe entre crochets de
          // Tailwind ne peut pas produire sans contorsion. Ecrit ici, c'est
          // valide a coup sur.
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
