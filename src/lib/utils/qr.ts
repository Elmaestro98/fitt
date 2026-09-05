// =============================================================================
// Generation de QR codes, en SVG.
//
// SVG et non PNG : le code du jour s'affiche sur un ecran d'accueil dont on
// ignore la taille et la definition. Un SVG reste net a n'importe quelle
// echelle, pese quelques centaines d'octets, et se rend cote serveur — donc
// aucun kilo-octet de JavaScript envoye au navigateur pour dessiner un carre
// noir et blanc.
//
// Le SVG produit est fabrique par la bibliotheque a partir d'un texte que
// NOUS construisons (jamais d'une saisie utilisateur) : il n'y a rien
// d'exterieur a echapper dans la chaine renvoyee.
// =============================================================================
import QRCode from "qrcode";

export type OptionsQR = {
  /** Cote du carre, en pixels CSS. Le SVG s'adapte, c'est un simple confort
   *  pour l'appelant qui veut poser une taille par defaut. */
  taille?: number;
  /** Marge blanche autour du motif, en modules (les petits carres). En
   *  dessous de 1, beaucoup d'appareils photo ne detectent plus le code. */
  marge?: number;
};

/**
 * Le QR d'un texte, sous forme de balise <svg> prete a inserer.
 *
 * Correction d'erreurs en niveau M (~15 %) : le niveau H coute un motif plus
 * dense, donc plus difficile a lire de loin, pour une robustesse dont un code
 * affiche a l'ecran n'a pas besoin — il n'est ni imprime, ni sali, ni plie.
 */
export async function qrEnSvg(
  texte: string,
  { taille = 200, marge = 1 }: OptionsQR = {},
): Promise<string> {
  return QRCode.toString(texte, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: marge,
    width: taille,
    // Noir sur blanc franc : le fond doit rester blanc meme si la carte qui
    // l'entoure change de teinte un jour. Un QR sur fond colore fait echouer
    // la detection sur les appareils photo les moins tolerants.
    color: { dark: "#191C1E", light: "#FFFFFF" },
  });
}
