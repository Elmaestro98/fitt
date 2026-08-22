"use client";

// Recherche globale de la barre haute du back-office.
//
// C'est le geste le plus frequent a l'accueil : quelqu'un se presente, le
// staff tape son nom. D'ou le raccourci clavier et la navigation aux fleches
// — a la reception, on a une main sur le clavier et l'autre sur le carnet.
//
// /!\ Aucun gymId ne transite ici (§3). Ce composant envoie une chaine de
// caracteres a une Server Action, qui resout le tenant elle-meme.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  actionRechercherAdherents,
  type ResultatRecherche,
} from "@/lib/actions/adherent";
import { formaterTelephone } from "@/lib/utils/telephone";
import { cn } from "@/lib/utils/cn";

/** Delai avant interrogation du serveur. Assez court pour paraitre instantane,
 *  assez long pour ne pas envoyer une requete par touche frappee. */
const DELAI_FRAPPE_MS = 250;

export function RechercheGlobale() {
  const router = useRouter();
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [total, setTotal] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const [surligne, setSurligne] = useState(0);
  const [enCours, demarrer] = useTransition();

  const conteneur = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  // Interrogation differee : on n'appelle le serveur qu'une fois la frappe
  // retombee. Le nettoyage annule la recherche precedente si l'utilisateur
  // continue de taper.
  useEffect(() => {
    const recherche = terme.trim();
    if (recherche.length < 2) {
      setResultats([]);
      setTotal(0);
      return;
    }

    const minuteur = setTimeout(() => {
      demarrer(async () => {
        const etat = await actionRechercherAdherents(recherche);
        setResultats(etat.resultats);
        setTotal(etat.total);
        setSurligne(0);
      });
    }, DELAI_FRAPPE_MS);

    return () => clearTimeout(minuteur);
  }, [terme]);

  // Fermeture au clic exterieur : sans ca, la liste resterait ouverte
  // par-dessus la page pendant qu'on travaille ailleurs.
  useEffect(() => {
    if (!ouvert) return;

    function surClic(evenement: MouseEvent) {
      if (!conteneur.current?.contains(evenement.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, [ouvert]);

  // Ctrl+K (Cmd+K sur Mac) : le raccourci que tout le monde connait.
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if ((evenement.ctrlKey || evenement.metaKey) && evenement.key === "k") {
        evenement.preventDefault();
        champ.current?.focus();
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, []);

  function fermer() {
    setOuvert(false);
    setTerme("");
    setResultats([]);
    setTotal(0);
  }

  function naviguerVers(id: string) {
    fermer();
    champ.current?.blur();
    router.push(`/adherents/${id}`);
  }

  function surClavier(evenement: React.KeyboardEvent) {
    if (evenement.key === "Escape") {
      fermer();
      champ.current?.blur();
      return;
    }
    if (!resultats.length) return;

    if (evenement.key === "ArrowDown") {
      evenement.preventDefault();
      setSurligne((i) => (i + 1) % resultats.length);
    }
    if (evenement.key === "ArrowUp") {
      evenement.preventDefault();
      setSurligne((i) => (i - 1 + resultats.length) % resultats.length);
    }
    if (evenement.key === "Enter") {
      evenement.preventDefault();
      const choisi = resultats[surligne];
      if (choisi) naviguerVers(choisi.id);
    }
  }

  const assezLong = terme.trim().length >= 2;
  const listeVisible = ouvert && assezLong;

  return (
    <div ref={conteneur} className="relative min-w-0 flex-1 sm:max-w-md">
      {/* peer-focus : la loupe passe a l'orange quand le champ prend le
          focus. Elle est AVANT le champ dans le DOM, donc on ne peut pas
          utiliser peer- ; on se contente d'une transition de couleur pilotee
          par le groupe parent. */}
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
          "text-muted transition-colors duration-[var(--duree-instant)]",
          ouvert && "text-brand",
        )}
      />

      <input
        ref={champ}
        type="search"
        value={terme}
        onChange={(e) => {
          setTerme(e.target.value);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={surClavier}
        placeholder="Rechercher un adherent..."
        aria-label="Rechercher un adherent"
        role="combobox"
        aria-expanded={listeVisible}
        aria-controls="resultats-recherche"
        autoComplete="off"
        className={cn(
          "h-10 w-full rounded-pill border border-transparent bg-sunken pr-9 pl-9",
          "text-sm text-ink placeholder:text-muted outline-none",
          // Le champ s'eclaircit et s'entoure d'un anneau pale au focus. Sur
          // un fond deja gris, changer la seule bordure ne se verrait pas.
          "transition-[background-color,border-color,box-shadow]",
          "duration-[var(--duree-instant)] ease-sortie",
          "focus:border-brand/40 focus:bg-surface focus:ring-4 focus:ring-brand/10",
          // Chrome ajoute sa propre croix sur un input[type=search] : sans
          // ca, deux boutons d'effacement se superposent.
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />

      {terme && (
        <button
          type="button"
          onClick={() => {
            fermer();
            champ.current?.focus();
          }}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
        >
          {enCours ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </button>
      )}

      {listeVisible && (
        <div
          id="resultats-recherche"
          role="listbox"
          className={cn(
            "absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden",
            "rounded-card border border-line bg-surface shadow-flottant",
            "animate-surgir origin-top",
          )}
        >
          {resultats.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              {enCours
                ? "Recherche..."
                : `Aucun adherent ne correspond a « ${terme.trim()} ».`}
            </p>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto">
                {resultats.map((adherent, index) => (
                  <li key={adherent.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === surligne}
                      onMouseEnter={() => setSurligne(index)}
                      onClick={() => naviguerVers(adherent.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                        "transition-colors duration-[var(--duree-instant)]",
                        index === surligne ? "bg-sunken" : "bg-transparent",
                      )}
                    >
                      <Avatar
                        nom={`${adherent.prenom} ${adherent.nom}`}
                        photoUrl={adherent.photoUrl}
                        taille="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {adherent.prenom} {adherent.nom}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {adherent.numero} ·{" "}
                          {formaterTelephone(adherent.telephone)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* La liste est plafonnee : sans ce lien, le staff croirait que
                  les six premiers resultats sont les seuls. */}
              {total > resultats.length && (
                <Link
                  href={`/adherents?recherche=${encodeURIComponent(terme.trim())}`}
                  onClick={fermer}
                  className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-sunken"
                >
                  Voir les {total} resultats
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
