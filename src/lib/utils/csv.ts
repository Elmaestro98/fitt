// Parseur CSV minimal (CLAUDE.md paragraphe 7 : pas de dependance pour un
// besoin simple). Gere les guillemets, le point-virgule (export Excel FR)
// comme la virgule, et le BOM UTF-8 qu'Excel ajoute en tete de fichier.

export type LigneCSV = Record<string, string>;

// Bornes Unicode des diacritiques combinants (accents detaches par
// normalize("NFD")), exprimees en code point plutot qu'en echappement \u
// dans une classe de caracteres, pour rester lisibles sans ambiguite.
const DIACRITIQUE_DEBUT = String.fromCharCode(0x0300);
const DIACRITIQUE_FIN = String.fromCharCode(0x036f);
const REGEX_DIACRITIQUES = new RegExp(`[${DIACRITIQUE_DEBUT}-${DIACRITIQUE_FIN}]`, "g");

/** "Prenom accentue" -> "prenom accentue" : les entetes ne dependent plus des accents. */
function normaliserEntete(s: string): string {
  return s.normalize("NFD").replace(REGEX_DIACRITIQUES, "").toLowerCase().trim();
}

function detecterSeparateur(premiereLigne: string): string {
  const virgules = (premiereLigne.match(/,/g) ?? []).length;
  const pointsVirgules = (premiereLigne.match(/;/g) ?? []).length;
  return pointsVirgules > virgules ? ";" : ",";
}

function parserLigne(ligne: string, separateur: string): string[] {
  const valeurs: string[] = [];
  let courante = "";
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];

    if (dansGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') {
          courante += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        courante += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === separateur) {
      valeurs.push(courante.trim());
      courante = "";
    } else {
      courante += c;
    }
  }
  valeurs.push(courante.trim());
  return valeurs;
}

/**
 * Transforme un fichier CSV en une liste d'objets, cle = entete normalisee.
 * La premiere ligne du fichier est toujours traitee comme l'entete.
 */
export function parserCSV(texte: string): LigneCSV[] {
  // Excel ajoute un BOM (U+FEFF) en tete des fichiers exportes en UTF-8.
  const nettoye = texte.charCodeAt(0) === 0xfeff ? texte.slice(1) : texte;
  const lignes = nettoye.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
  if (lignes.length === 0) return [];

  const separateur = detecterSeparateur(lignes[0]);
  const entetes = parserLigne(lignes[0], separateur).map(normaliserEntete);

  return lignes.slice(1).map((ligne) => {
    const valeurs = parserLigne(ligne, separateur);
    const objet: LigneCSV = {};
    entetes.forEach((cle, i) => {
      objet[cle] = valeurs[i] ?? "";
    });
    return objet;
  });
}
