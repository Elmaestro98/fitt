// Calcul de la date de fin d'un abonnement (CLAUDE.md §9).
//
// Cette fonction n'est appelee QU'UNE FOIS, a la souscription. Son resultat
// est ecrit dans Abonnement.finLe et n'est plus jamais recalcule.

export type UniteDuree = "JOUR" | "SEMAINE" | "MOIS" | "ANNEE";

/* Dakar est a UTC+0 toute l'annee : on peut faire l'arithmetique en UTC sans
   decalage. On utilise malgre tout les methodes UTC explicitement, pour que le
   calcul ne depende pas du fuseau de la machine qui execute le code (le poste
   du developpeur, ou un serveur Vercel a Francfort). */
export function ajouterDuree(
  debut: Date,
  valeur: number,
  unite: UniteDuree,
): Date {
  const fin = new Date(debut.getTime());

  switch (unite) {
    case "JOUR":
      fin.setUTCDate(fin.getUTCDate() + valeur);
      break;

    case "SEMAINE":
      fin.setUTCDate(fin.getUTCDate() + valeur * 7);
      break;

    case "MOIS":
      ajouterMois(fin, valeur);
      break;

    case "ANNEE":
      // Un an, c'est douze mois : passer par la meme fonction traite le cas
      // du 29 fevrier d'une annee bissextile.
      ajouterMois(fin, valeur * 12);
      break;
  }

  return fin;
}

/**
 * Ajoute des mois calendaires, en ramenant au dernier jour du mois quand le
 * jour n'existe pas dans le mois d'arrivee.
 *
 * Sans cette precaution, JavaScript deborde :
 *   31 janvier + 1 mois -> 31 fevrier -> 3 mars   ❌
 *   31 janvier + 1 mois -> 28 fevrier              ✅
 *
 * Un adherent qui souscrit le 31 ne doit pas gagner trois jours.
 */
function ajouterMois(date: Date, mois: number) {
  const jourVoulu = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + mois);
  // Si le jour a change, c'est que le mois d'arrivee etait trop court :
  // setUTCDate(0) recule au dernier jour du mois precedent, donc au bon.
  if (date.getUTCDate() !== jourVoulu) date.setUTCDate(0);
}

/** "1 mois", "3 mois", "1 an", "10 jours" — pour l'affichage. */
export function formaterDuree(valeur: number, unite: UniteDuree): string {
  const pluriel = valeur > 1;
  switch (unite) {
    case "JOUR":
      return `${valeur} jour${pluriel ? "s" : ""}`;
    case "SEMAINE":
      return `${valeur} semaine${pluriel ? "s" : ""}`;
    case "MOIS":
      return `${valeur} mois`;
    case "ANNEE":
      return `${valeur} an${pluriel ? "s" : ""}`;
  }
}

/** Jours restants avant l'echeance. Negatif si depassee. */
export function joursRestants(finLe: Date, maintenant = new Date()): number {
  const MS_PAR_JOUR = 24 * 60 * 60 * 1000;
  return Math.ceil((finLe.getTime() - maintenant.getTime()) / MS_PAR_JOUR);
}
