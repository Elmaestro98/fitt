// Formatage d'affichage (CLAUDE.md §8).

const FUSEAU = "Africa/Dakar";

/**
 * Montants en FCFA : entiers, jamais de decimales, jamais de flottants.
 *   formatFCFA(15000) -> "15 000 FCFA"
 *
 * L'espace des milliers est une espace insecable etroite (U+202F) : elle
 * empeche "15" et "000" de se retrouver sur deux lignes differentes.
 */
export function formatFCFA(montant: number): string {
  return `${Math.round(montant).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

/** "18/08/2026" — stockage UTC, affichage a l'heure de Dakar. */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSEAU,
  }).format(date);
}

/** "18 aout 2026" — pour les titres et les fiches. */
export function formatDateLongue(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU,
  }).format(date);
}

/** "18/08/2026 a 14:32" — pour les pointages et l'historique. */
export function formatDateHeure(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSEAU,
  }).format(date);
}

/** "14:32" — pour le planning des cours. */
export function formatHeure(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU,
  }).format(date);
}

/**
 * Numero d'adherent visible : 42 -> "FITT-0042" (CLAUDE.md §8).
 *
 * Le prefixe vient de Gym.prefixeAdherent, "FITT" par defaut, modifiable a
 * sa guise dans les parametres. Les numeros deja attribues ne changent
 * jamais retroactivement : seuls les appelants passent le prefixe ACTUEL de
 * la salle, au moment de creer un nouvel adherent.
 */
export function formatNumeroAdherent(
  sequence: number,
  prefixe: string = "FITT",
): string {
  return `${prefixe}-${String(sequence).padStart(4, "0")}`;
}
