import { formatDate } from "@/lib/utils/format";

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
