// =============================================================================
// La regle qui decide si une salle a le droit d'utiliser Fitt.
//
// /!\ Fonction PURE et volontairement seule de son espece : elle est appelee
// par les DEUX portes d'entree du produit — getTenantContext() cote staff et
// lireSessionAdherent() cote adherent (§5). Ecrite deux fois, elle finirait
// par diverger, et une des deux populations passerait a travers.
//
// Elle ne lit ni session ni base : on lui donne l'etat de la salle, elle rend
// un verdict. C'est ce qui la rend testable et impossible a contourner par
// oubli.
// =============================================================================

export type EtatAccesSalle =
  | "ouvert"
  /** Jamais activee par le Super Admin. */
  | "en-attente"
  /** Activee puis coupee a la main. */
  | "suspendue"
  /** Periode d'essai terminee, et pas encore cliente payante. */
  | "essai-expire";

export type SalleAccessible = {
  actif: boolean;
  activeeLe: Date | null;
  essaiJusquau: Date | null;
  abonnee: boolean;
};

/**
 * L'ordre des tests n'est pas anodin :
 *
 *   1. `actif` prime sur tout. Une suspension manuelle du Super Admin ne se
 *      contourne pas en payant.
 *   2. `abonnee` prime sur l'essai. Marquer une salle cliente lui rend
 *      l'acces sans qu'on ait a effacer sa date d'essai — l'historique reste.
 *   3. Pas de date d'essai = pas de limite. C'est le defaut, et c'est ce qui
 *      preserve le comportement des salles anterieures a cette regle.
 */
export function etatAccesSalle(
  salle: SalleAccessible,
  maintenant: Date = new Date(),
): EtatAccesSalle {
  if (!salle.actif) {
    return salle.activeeLe ? "suspendue" : "en-attente";
  }
  if (salle.abonnee) return "ouvert";
  if (!salle.essaiJusquau) return "ouvert";

  return salle.essaiJusquau >= maintenant ? "ouvert" : "essai-expire";
}

/** Raccourci lisible pour les appelants qui ne veulent qu'un oui/non. */
export function salleAccessible(
  salle: SalleAccessible,
  maintenant: Date = new Date(),
): boolean {
  return etatAccesSalle(salle, maintenant) === "ouvert";
}

/**
 * Jours restants avant la fin de l'essai. null quand la question n'a pas de
 * sens (abonnee, ou aucun essai fixe).
 *
 * Arrondi vers le HAUT : un essai qui se termine dans six heures affiche
 * "1 jour", pas "0". Annoncer zero a quelqu'un qui a encore l'acces serait
 * faux, et l'inquieterait pour rien.
 */
export function joursRestantsEssai(
  salle: SalleAccessible,
  maintenant: Date = new Date(),
): number | null {
  if (salle.abonnee || !salle.essaiJusquau) return null;

  const millisecondes = salle.essaiJusquau.getTime() - maintenant.getTime();
  return Math.max(0, Math.ceil(millisecondes / (24 * 60 * 60 * 1000)));
}
