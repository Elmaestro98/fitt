"use client";

// Le filtre de periode du tableau de bord.
//
// Composant client, contrairement au filtre de /rapports qui n'est fait que
// de liens : ici il y a une vraie saisie a recueillir (deux dates) et un
// panneau a ouvrir. Les criteres n'en vivent pas moins dans l'URL et non
// dans un useState — meme raison que partout ailleurs dans Fitt : la vue
// devient partageable, le bouton "retour" du navigateur fonctionne, et le
// serveur reste seul maitre du calcul.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CalendarRange, Check, X } from "lucide-react";
import { PERIODES, type ClePeriode } from "@/lib/utils/periode";
import { cn } from "@/lib/utils/cn";

const LIBELLES: Record<(typeof PERIODES)[number], string> = {
  "7j": "7 jours",
  "30j": "30 jours",
  mois: "Ce mois",
  "3m": "3 mois",
  "12m": "12 mois",
};

export function FiltrePeriode({
  cle,
  libelle,
  debutISO,
  finISO,
  maxISO,
}: {
  cle: ClePeriode;
  /** "Du 20 juil. au 2 sept." — affiche sur la pastille personnalisee. */
  libelle: string;
  debutISO: string;
  /** Dernier jour COMPRIS, deja reconverti par la page : l'utilisateur ne
   *  doit jamais voir la borne exclusive interne. */
  finISO: string;
  /**
   * Aujourd'hui, au format ISO, calcule par le SERVEUR.
   *
   * /!\ Ne surtout pas le deduire d'un `new Date()` ici : le rendu serveur et
   * le rendu navigateur tomberaient sur deux valeurs differentes autour de
   * minuit, et React signalerait une erreur d'hydratation.
   */
  maxISO: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrerTransition] = useTransition();

  const [panneauOuvert, setPanneauOuvert] = useState(cle === "perso");
  const [du, setDu] = useState(debutISO);
  const [au, setAu] = useState(finISO);
  const panneau = useRef<HTMLDivElement>(null);

  // L'URL fait autorite : un retour arriere du navigateur doit ramener les
  // champs sur les dates de la vue affichee, pas laisser une saisie orpheline.
  useEffect(() => {
    setDu(debutISO);
    setAu(finISO);
  }, [debutISO, finISO]);

  // Fermeture au clic exterieur et a la touche Echap — un panneau qui ne se
  // referme qu'en rejouant le clic sur son bouton est un piege sur telephone.
  useEffect(() => {
    if (!panneauOuvert) return;

    function auClic(evenement: MouseEvent) {
      if (!panneau.current?.contains(evenement.target as Node)) {
        setPanneauOuvert(false);
      }
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setPanneauOuvert(false);
    }

    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [panneauOuvert]);

  function naviguer(modif: Record<string, string | null>) {
    const suivants = new URLSearchParams(params.toString());
    for (const [nom, valeur] of Object.entries(modif)) {
      if (valeur) suivants.set(nom, valeur);
      else suivants.delete(nom);
    }
    const requete = suivants.toString();
    demarrerTransition(() =>
      router.push(requete ? `/tableau-de-bord?${requete}` : "/tableau-de-bord"),
    );
  }

  function choisirPreselection(valeur: (typeof PERIODES)[number]) {
    setPanneauOuvert(false);
    // Les dates libres sont retirees : laisser trainer `du`/`au` dans l'URL
    // les ferait gagner sur la preselection au prochain rendu, et le clic
    // n'aurait aucun effet visible.
    naviguer({
      periode: valeur === "mois" ? null : valeur,
      du: null,
      au: null,
    });
  }

  function appliquerPlage() {
    if (!du || !au) return;
    setPanneauOuvert(false);
    naviguer({ periode: null, du, au });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        // Le filtre s'estompe pendant que le serveur recalcule : sans ce
        // retour, un clic sur une longue periode semble n'avoir rien fait.
        enCours && "pointer-events-none opacity-60 transition-opacity",
      )}
    >
      {PERIODES.map((valeur) => (
        <button
          key={valeur}
          type="button"
          onClick={() => choisirPreselection(valeur)}
          aria-pressed={cle === valeur}
          className={cn(
            "enfoncable flex h-9 min-h-9 items-center rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
            cle === valeur
              ? "bg-ink font-medium text-white"
              : "bg-surface text-muted hover:bg-sunken hover:text-ink",
          )}
        >
          {LIBELLES[valeur]}
        </button>
      ))}

      <div className="relative" ref={panneau}>
        <button
          type="button"
          onClick={() => setPanneauOuvert((ouvert) => !ouvert)}
          aria-expanded={panneauOuvert}
          aria-haspopup="dialog"
          className={cn(
            "enfoncable flex h-9 min-h-9 items-center gap-1.5 rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
            cle === "perso"
              ? "bg-ink font-medium text-white"
              : "bg-surface text-muted hover:bg-sunken hover:text-ink",
          )}
        >
          <CalendarRange className="size-4" />
          {cle === "perso" ? libelle : "Dates precises"}
        </button>

        {panneauOuvert && (
          <div
            role="dialog"
            aria-label="Choisir une plage de dates"
            className={
              "animate-surgir absolute top-11 right-0 z-30 w-[17rem] rounded-card " +
              "border border-line bg-surface p-3 shadow-flottant"
            }
          >
            <div className="space-y-2.5">
              <Champ
                id="periode-du"
                label="Du"
                valeur={du}
                max={au || maxISO}
                onChange={setDu}
              />
              <Champ
                id="periode-au"
                label="Au"
                valeur={au}
                min={du}
                max={maxISO}
                onChange={setAu}
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={appliquerPlage}
                disabled={!du || !au}
                className={
                  "enfoncable flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control " +
                  "bg-brand text-sm font-medium text-white transition-opacity " +
                  "hover:opacity-90 disabled:opacity-40"
                }
              >
                <Check className="size-4" />
                Appliquer
              </button>
              {cle === "perso" && (
                <button
                  type="button"
                  onClick={() => choisirPreselection("mois")}
                  aria-label="Revenir au mois en cours"
                  className={
                    "enfoncable flex size-10 items-center justify-center rounded-control " +
                    "border border-line text-muted transition-colors hover:bg-sunken hover:text-ink"
                  }
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <p className="mt-2.5 text-xs text-muted">
              Les deux dates sont comprises dans la periode.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Champ({
  id,
  label,
  valeur,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  valeur: string;
  min?: string;
  max?: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={valeur}
        min={min}
        max={max}
        onChange={(evenement) => onChange(evenement.target.value)}
        className={
          "mt-1 h-11 w-full rounded-control border border-line bg-sunken px-3 " +
          "text-sm text-ink focus:border-brand focus:outline-none"
        }
      />
    </div>
  );
}
