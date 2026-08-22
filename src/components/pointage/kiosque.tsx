"use client";

// Borne de pointage. Structure reprise de public/kios.png : saisie et
// resultat a gauche, derniers passages a droite.
//
// La recherche se fait EN LOCAL, sur la liste des adherents recue au
// chargement. Deux consequences voulues :
//   - la borne repond instantanement a la frappe, sans aller-retour reseau ;
//   - elle continue d'identifier les adherents pendant une coupure (§9).
//
// Le champ accepte aussi une douchette USB : ces lecteurs tapent le numero
// puis Entree, exactement comme un clavier. Un seul resultat + Entree pointe
// donc directement.
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, UserSearch } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { CarteResultat, type ResultatPointage } from "./carte-resultat";
import { ListePassages, type Passage } from "./liste-passages";
import { ResultatsRecherche } from "./resultats-recherche";
import { EtatReseau } from "./etat-reseau";
import { useFilePointage } from "@/hooks/use-file-pointage";
import type { AdherentKiosque } from "@/lib/data/pointage";

/** Duree d'affichage du resultat avant retour au champ de saisie. */
const AFFICHAGE_RESULTAT_MS = 6000;

const MAX_RESULTATS = 6;

/** Minuscules et sans accents : "Ndèye" doit se trouver en tapant "ndeye". */
function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function chercher(adherents: AdherentKiosque[], saisie: string) {
  const termes = normaliser(saisie.trim());
  if (termes.length < 2) return [];

  const chiffres = termes.replace(/\D/g, "");

  return adherents
    .filter((a) => {
      const nomComplet = normaliser(`${a.prenom} ${a.nom}`);
      if (nomComplet.includes(termes)) return true;
      if (normaliser(a.numero).includes(termes)) return true;
      // Recherche par telephone seulement si la saisie contient des chiffres,
      // sinon "0" ferait remonter la moitie du fichier.
      if (chiffres.length >= 4 && a.telephone.includes(chiffres)) return true;
      return false;
    })
    .slice(0, MAX_RESULTATS);
}

export function Kiosque({
  adherents,
  passagesInitiaux,
}: {
  adherents: AdherentKiosque[];
  passagesInitiaux: Passage[];
}) {
  const { monte, file, enAttente, enLigne, synchroEnCours, synchroniser, pointer } =
    useFilePointage();

  const [saisie, setSaisie] = useState("");
  const [resultat, setResultat] = useState<ResultatPointage | null>(null);
  const [passagesLocaux, setPassagesLocaux] = useState<Passage[]>([]);

  const champ = useRef<HTMLInputElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trouves = useMemo(() => chercher(adherents, saisie), [adherents, saisie]);

  // Les cles encore en file : elles marquent les passages "en attente d'envoi".
  const clesEnAttente = useMemo(
    () => new Set(file.map((p) => p.cleLocale)),
    [file],
  );

  useEffect(() => {
    return () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    };
  }, []);

  function enregistrer(adherent: AdherentKiosque) {
    const passage = pointer(adherent.id, "KIOSQUE");

    setResultat({ adherent, enAttente: true });

    setPassagesLocaux((precedents) => [
      {
        id: passage.cleLocale,
        horodatage: passage.horodatage,
        statutAdherent: adherent.statut,
        adherent: {
          id: adherent.id,
          prenom: adherent.prenom,
          nom: adherent.nom,
          numero: adherent.numero,
          photoUrl: adherent.photoUrl,
        },
      },
      ...precedents,
    ]);

    setSaisie("");
    champ.current?.focus();

    // L'ecran revient de lui-meme a la saisie : personne ne doit avoir a
    // cliquer sur "suivant" entre deux adherents.
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(
      () => setResultat(null),
      AFFICHAGE_RESULTAT_MS,
    );
  }

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>) {
    // Cas de la douchette : elle termine sa saisie par Entree.
    if (e.key === "Enter" && trouves.length === 1) {
      e.preventDefault();
      enregistrer(trouves[0]);
    }
    if (e.key === "Escape") {
      setSaisie("");
      setResultat(null);
    }
  }

  // Les passages locaux prennent la tete de la liste ; le serveur fournit la
  // suite. On limite l'ensemble a ce que la colonne peut montrer.
  const passages: Passage[] = [
    ...passagesLocaux.map((p) => ({
      ...p,
      local: clesEnAttente.has(p.id),
    })),
    ...passagesInitiaux,
  ].slice(0, 12);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <label
            htmlFor="recherche-pointage"
            className="display block text-center text-lg font-semibold tracking-tight text-ink sm:text-xl"
          >
            Qui entre&nbsp;?
          </label>
          <p className="mt-1 text-center text-sm text-muted">
            Tapez un nom, un numero d&apos;adherent ou un telephone.
          </p>

          <div className="relative mx-auto mt-4 max-w-lg">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
            <input
              id="recherche-pointage"
              ref={champ}
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={surTouche}
              autoFocus
              autoComplete="off"
              placeholder="Ex. Diop, FITT-0042, 77..."
              className={
                // Champ de la borne : plus grand que partout ailleurs, et le
                // focus doit se voir de loin — anneau large, fond qui
                // s'eclaircit. C'est le seul champ de l'application qu'on
                // utilise debout, sans regarder ses mains.
                "h-14 w-full rounded-control border border-line bg-sunken pr-4 pl-12 " +
                "text-lg text-ink placeholder:text-muted outline-none " +
                "transition-[background-color,border-color,box-shadow] " +
                "duration-[var(--duree-courte)] ease-sortie " +
                "focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15"
              }
            />
          </div>

          {saisie.trim().length >= 2 && trouves.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted">
              Aucun adherent ne correspond a «&nbsp;{saisie.trim()}&nbsp;».
            </p>
          )}
        </Card>

        {trouves.length > 0 && (
          <Card className="overflow-hidden">
            <ResultatsRecherche adherents={trouves} onChoisir={enregistrer} />
          </Card>
        )}

        {resultat && trouves.length === 0 && (
          <CarteResultat
            resultat={{
              ...resultat,
              enAttente: enAttente > 0,
            }}
          />
        )}

        {!resultat && trouves.length === 0 && saisie.trim().length < 2 && (
          <div className="rounded-card border border-dashed border-line px-6 py-12 text-center">
            <UserSearch className="mx-auto size-7 text-muted" />
            <p className="mt-3 text-sm text-muted">
              La borne est prete. Le passage sera enregistre meme si la
              connexion est coupee.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <EtatReseau
          monte={monte}
          enLigne={enLigne}
          enAttente={enAttente}
          synchroEnCours={synchroEnCours}
          onSynchroniser={() => void synchroniser()}
        />

        <Card className="overflow-hidden">
          <CardHeader titre="Derniers passages" />
          <ListePassages passages={passages} />
        </Card>
      </div>
    </div>
  );
}
