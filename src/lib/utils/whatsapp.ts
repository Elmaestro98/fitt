import { formatDate, formatDateLongue, formatHeure } from "@/lib/utils/format";

// Rappels WhatsApp (Lot 2, premiere marche).
//
// Pas de compte WhatsApp Business, pas de webhook, pas d'envoi automatique a
// ce stade : on ouvre wa.me avec un message pre-rempli, que le staff relit et
// envoie lui-meme d'un clic. C'est deja ce que la salle fait a la main
// aujourd'hui pour les liens d'inscription (§4) — on l'outille, on ne change
// pas le geste.

/**
 * "+221771234567" -> lien "https://wa.me/221771234567?text=...".
 * wa.me attend l'indicatif SANS le "+".
 */
export function lienWhatsApp(telephone: string, message: string): string {
  const numero = telephone.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

/* A partir de combien de jours restants proposer une relance. Un abonnement
   qui vient d'etre souscrit (60 jours restants) n'a pas besoin d'un rappel :
   ca noierait les echeances vraiment proches. */
export const SEUIL_RELANCE_JOURS = 7;

/** Le texte du rappel, partage entre la liste globale et la fiche adherent. */
export function messageRelanceAbonnement(
  prenom: string,
  nomFormule: string,
  nomSalle: string,
  finLe: Date,
  dejaEchu: boolean,
): string {
  const date = formatDate(finLe);
  return dejaEchu
    ? `Bonjour ${prenom}, votre abonnement ${nomFormule} chez ${nomSalle} est arrive a echeance le ${date}. N'hesitez pas a passer renouveler votre abonnement.`
    : `Bonjour ${prenom}, votre abonnement ${nomFormule} chez ${nomSalle} arrive a echeance le ${date}. Pensez a renouveler pour continuer a en profiter !`;
}

/**
 * Rappel d'une inscription a une seance de cours (Lot 4).
 *
 * Meme principe que messageRelanceAbonnement : pas d'envoi automatique, le
 * staff relit et envoie lui-meme. C'est la reponse au constat qu'un adherent
 * inscrit par le staff n'est prevenu par aucun autre moyen — ni notification,
 * ni affichage dans son espace avant qu'il ne s'y connecte lui-meme.
 */
export function messageRappelSeance(
  prenom: string,
  nomTypeCours: string,
  nomSalle: string,
  debutLe: Date,
): string {
  const date = formatDateLongue(debutLe);
  const heure = formatHeure(debutLe);
  return `Bonjour ${prenom}, petit rappel : vous etes inscrit(e) au cours ${nomTypeCours} chez ${nomSalle} le ${date} a ${heure}. A bientot !`;
}

/**
 * Message aux adherents qui ne viennent plus, alors que leur abonnement
 * court toujours.
 *
 * /!\ Ton volontairement chaleureux et SANS reproche. Ces personnes paient :
 * leur signaler leur absence comme un manquement est le meilleur moyen de
 * les faire partir pour de bon. On ouvre la porte, on ne fait pas les
 * comptes — et on ne donne aucun conseil sante ou sportif (§9).
 */
export function messageReprise(
  prenom: string,
  nomSalle: string,
  jamaisVenu: boolean,
): string {
  return jamaisVenu
    ? `Bonjour ${prenom}, on ne vous a pas encore vu(e) chez ${nomSalle} ! Votre abonnement est actif, passez quand vous voulez — on vous fera visiter et on vous installera.`
    : `Bonjour ${prenom}, on ne vous voit plus chez ${nomSalle} et on tenait a prendre de vos nouvelles. Votre abonnement est toujours actif : au plaisir de vous revoir bientot !`;
}
