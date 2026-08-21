// Calculs sur une commande de boutique.
//
// Fonction pure, sans session ni base : elle vit ici plutot que dans l'un des
// deux fichiers d'acces aux donnees, parce qu'elle sert des DEUX cotes
// (espace adherent et back-office). La ranger cote adherent obligerait le
// staff a importer le module de session adherent, et inversement.

/**
 * Total d'une commande, en FCFA.
 *
 * /!\ Toujours calcule depuis les lignes FIGEES a la commande (§9), jamais
 * depuis le tarif actuel du produit : un changement de prix ne doit pas
 * reecrire ce qu'un adherent doit reellement payer.
 */
export function totalCommande(
  lignes: { prixUnitaire: number; quantite: number }[],
): number {
  return lignes.reduce((somme, l) => somme + l.prixUnitaire * l.quantite, 0);
}
