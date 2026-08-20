"use client";

// File locale des passages — la traduction concrete de l'interdit du §9 :
// "Bloquer le pointage en cas de coupure reseau. La salle doit rester
// ouverte. File locale + synchronisation au retour."
//
// Principe : un passage est d'abord ecrit dans localStorage, ENSUITE envoye.
// L'ecran confirme des l'ecriture locale, sans attendre le serveur. Si le
// reseau est coupe, rien ne change pour l'adherent devant la borne — la file
// se videra toute seule au retour.
//
// L'idempotence est garantie cote base par (gymId, cleLocale) : rejouer une
// file deja enregistree ne cree aucun doublon.
import { useCallback, useEffect, useRef, useState } from "react";
import { actionPointer } from "@/lib/actions/pointage";

const CLE_STOCKAGE = "fitt.pointages.file";

/** Nouvelle tentative periodique tant que la file n'est pas vide. */
const INTERVALLE_RETENTE_MS = 20_000;

/**
 * Taille maximale d'un envoi, sous la limite serveur (schemaLotPointages,
 * max 200 — voir lib/data/pointage.ts).
 *
 * /!\ Sans ce decoupage, une file qui depasse 200 passages (salle restee
 * hors ligne toute une journee) ferait echouer l'envoi EN BLOC a chaque
 * tentative : le serveur rejette le tableau entier des qu'il depasse sa
 * limite, meme les 200 premiers passages valides. La file resterait alors
 * bloquee pour toujours, meme au retour du reseau — exactement ce que le
 * §9 interdit ("la salle doit rester ouverte").
 */
const TAILLE_LOT_MAX = 150;

export type PassageEnAttente = {
  cleLocale: string;
  adherentId: string;
  horodatage: string; // ISO
  source: "KIOSQUE" | "STAFF";
};

function lireFile(): PassageEnAttente[] {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    return brut ? (JSON.parse(brut) as PassageEnAttente[]) : [];
  } catch {
    // Stockage plein, JSON corrompu, mode navigation privee : on repart d'une
    // file vide plutot que de casser la borne.
    return [];
  }
}

function ecrireFile(file: PassageEnAttente[]) {
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(file));
  } catch {
    // Rien a faire de mieux ici : le passage en cours reste en memoire.
  }
}

export function useFilePointage() {
  // Le stockage local n'existe pas au premier rendu serveur. Sans ce
  // "monte", on provoquerait une erreur d'hydratation (CLAUDE.md §6).
  const [monte, setMonte] = useState(false);
  const [file, setFile] = useState<PassageEnAttente[]>([]);
  const [enLigne, setEnLigne] = useState(true);
  const [synchroEnCours, setSynchroEnCours] = useState(false);

  // Evite deux synchronisations simultanees (clic + minuteur, par exemple).
  const verrou = useRef(false);

  useEffect(() => {
    setMonte(true);
    setFile(lireFile());
    setEnLigne(navigator.onLine);
  }, []);

  /** Envoie tout ce qui attend. Ne jette jamais : un echec laisse la file. */
  const synchroniser = useCallback(async () => {
    if (verrou.current) return;

    const enAttente = lireFile();
    if (enAttente.length === 0) return;

    verrou.current = true;
    setSynchroEnCours(true);

    try {
      // Envoi par lots de TAILLE_LOT_MAX, jamais la file entiere d'un coup :
      // voir le commentaire de TAILLE_LOT_MAX. Chaque lot acquitte est retire
      // avant d'envoyer le suivant, donc un echec en cours de route laisse
      // quand meme les lots precedents synchronises.
      for (let i = 0; i < enAttente.length; i += TAILLE_LOT_MAX) {
        const lot = enAttente
          .slice(i, i + TAILLE_LOT_MAX)
          // On n'envoie que ce que le serveur attend.
          .map((p) => ({
            cleLocale: p.cleLocale,
            adherentId: p.adherentId,
            horodatage: p.horodatage,
            source: p.source,
          }));

        const resultat = await actionPointer(lot);

        if (resultat.cles.length > 0) {
          // On ne retire QUE les cles acquittees. Un passage arrive entre-
          // temps dans la file reste en attente au lieu d'etre efface.
          const acquittees = new Set(resultat.cles);
          const restant = lireFile().filter(
            (p) => !acquittees.has(p.cleLocale),
          );
          ecrireFile(restant);
          setFile(restant);
        } else {
          // Aucune cle acquittee : le serveur est injoignable ou en echec.
          // Inutile d'enchainer les lots suivants dans la meme tentative, le
          // minuteur ou le retour du reseau la relancera.
          break;
        }
      }

      setEnLigne(true);
    } catch {
      // Serveur injoignable : la file reste intacte, on retentera.
      setEnLigne(false);
    } finally {
      verrou.current = false;
      setSynchroEnCours(false);
    }
  }, []);

  /**
   * Enregistre un passage. Retourne immediatement : l'ecriture locale est
   * la seule etape bloquante, et elle ne depend pas du reseau.
   */
  const pointer = useCallback(
    (adherentId: string, source: "KIOSQUE" | "STAFF" = "KIOSQUE") => {
      const passage: PassageEnAttente = {
        // La borne fabrique elle-meme l'identifiant, avant tout appel reseau.
        cleLocale:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        adherentId,
        horodatage: new Date().toISOString(),
        source,
      };

      const suivante = [...lireFile(), passage];
      ecrireFile(suivante);
      setFile(suivante);

      // Tentative d'envoi immediate, sans que l'appelant ait a l'attendre.
      void synchroniser();

      return passage;
    },
    [synchroniser],
  );

  // Retour du reseau : on vide la file sans attendre le prochain minuteur.
  useEffect(() => {
    if (!monte) return;

    const revenu = () => {
      setEnLigne(true);
      void synchroniser();
    };
    const perdu = () => setEnLigne(false);

    window.addEventListener("online", revenu);
    window.addEventListener("offline", perdu);
    return () => {
      window.removeEventListener("online", revenu);
      window.removeEventListener("offline", perdu);
    };
  }, [monte, synchroniser]);

  // Filet de securite : navigator.onLine ment reguliererement (Wi-Fi
  // connecte mais sans Internet). On retente donc periodiquement tant qu'il
  // reste quelque chose, quel que soit l'etat declare par le navigateur.
  useEffect(() => {
    if (!monte || file.length === 0) return;

    const minuteur = setInterval(() => {
      void synchroniser();
    }, INTERVALLE_RETENTE_MS);

    return () => clearInterval(minuteur);
  }, [monte, file.length, synchroniser]);

  return {
    monte,
    /** Les passages encore en file, pour les marquer a l'ecran. */
    file,
    enAttente: file.length,
    enLigne,
    synchroEnCours,
    pointer,
    synchroniser,
  };
}
