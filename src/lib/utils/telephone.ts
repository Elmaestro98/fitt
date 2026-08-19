// Telephones senegalais (CLAUDE.md §8).
//   stockage : "+221771234567"        — normalise, sans espace
//   affichage : "+221 77 123 45 67"   — lisible par le gerant
//
// Pourquoi normaliser : sans ca, "77 123 45 67", "+221771234567" et
// "00221 77 123 45 67" creeraient trois adherents pour la meme personne,
// et la contrainte @@unique([gymId, telephone]) ne servirait a rien.

const INDICATIF = "+221";

/** Un numero senegalais valide : 9 chiffres commencant par 7. */
const NEUF_CHIFFRES = /^7\d{8}$/;

/**
 * Transforme une saisie libre en forme stockable, ou renvoie null si le
 * numero n'est pas un mobile senegalais valide.
 *
 *   "77 123 45 67"        -> "+221771234567"
 *   "+221 77 123 45 67"   -> "+221771234567"
 *   "00221771234567"      -> "+221771234567"
 *   "12345"               -> null
 */
export function normaliserTelephone(saisie: string): string | null {
  // On ne garde que les chiffres, en memorisant un eventuel "+" de tete.
  let chiffres = saisie.replace(/\D/g, "");

  // Preferer le prefixe international le plus long d'abord : "00221" contient
  // "221", donc l'ordre du test compte.
  if (chiffres.startsWith("00221")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("221")) chiffres = chiffres.slice(3);

  if (!NEUF_CHIFFRES.test(chiffres)) return null;
  return INDICATIF + chiffres;
}

/**
 * Remet les espaces pour l'affichage.
 *   "+221771234567" -> "+221 77 123 45 67"
 */
export function formaterTelephone(stocke: string): string {
  const n = stocke.replace(/\D/g, "").replace(/^221/, "");
  if (!NEUF_CHIFFRES.test(n)) return stocke; // donnee inattendue : on n'invente rien
  return `${INDICATIF} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}

/** Un fixe senegalais : 9 chiffres commencant par 3 (33 pour Dakar, 
 *  30/32/34/etc. en region). */
const FIXE = /^3\d{8}$/;

/**
 * Meme normalisation, mais pour le numero d'une SALLE : elle accepte aussi
 * les lignes fixes.
 *
 * Pourquoi une fonction separee plutot qu'un assouplissement de
 * normaliserTelephone : celle-ci garantit l'unicite (gymId, telephone) des
 * adherents, dont le mobile sert aussi aux rappels WhatsApp. Y laisser entrer
 * un fixe ferait echouer silencieusement les notifications du Lot 2.
 *
 *   "33 823 45 67" -> "+221338234567"
 *   "77 123 45 67" -> "+221771234567"
 */
export function normaliserTelephoneSalle(saisie: string): string | null {
  let chiffres = saisie.replace(/\D/g, "");

  if (chiffres.startsWith("00221")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("221")) chiffres = chiffres.slice(3);

  if (!NEUF_CHIFFRES.test(chiffres) && !FIXE.test(chiffres)) return null;
  return INDICATIF + chiffres;
}

/** Affichage d'un numero de salle : accepte fixe comme mobile. */
export function formaterTelephoneSalle(stocke: string): string {
  const n = stocke.replace(/\D/g, "").replace(/^221/, "");
  if (!NEUF_CHIFFRES.test(n) && !FIXE.test(n)) return stocke;
  return `${INDICATIF} ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}
