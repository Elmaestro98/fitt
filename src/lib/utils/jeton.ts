// Jetons d'invitation (CLAUDE.md §4).
//
// /!\ Un seul principe, et il est absolu (§9) : le jeton en clair ne touche
// JAMAIS la base. On y ecrit son empreinte SHA-256, rien d'autre. Une lecture
// complete de la base ne donne donc acces a aucun lien.
//
// Consequence assumee, a expliquer au gerant : un lien perdu ne se retrouve
// pas. Il s'en genere un nouveau. C'est le comportement d'une cle d'API, et
// c'est le prix de la regle.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** 32 octets aleatoires, comme l'exige le §4. */
const OCTETS = 32;

/** Duree de validite par defaut, egalement fixee par le §4. */
export const JOURS_VALIDITE_DEFAUT = 7;

/**
 * Fabrique un jeton neuf.
 *
 * Retourne le clair ET son empreinte : l'appelant ecrit l'empreinte en base
 * et n'affiche le clair qu'une fois, immediatement.
 *
 * base64url plutot que hexa : 43 caracteres au lieu de 64, pour une URL plus
 * courte a saisir ou a encoder dans un QR code, a securite identique.
 */
export function genererJeton() {
  const clair = randomBytes(OCTETS).toString("base64url");
  return { clair, hache: hacherJeton(clair) };
}

/**
 * Empreinte SHA-256 d'un jeton, en hexadecimal.
 *
 * Pas de sel, volontairement : le jeton fait deja 32 octets aleatoires: il
 * n'est ni devinable ni attaquable par dictionnaire, contrairement a un mot
 * de passe. Un sel n'apporterait rien et empecherait la recherche directe par
 * empreinte.
 */
export function hacherJeton(clair: string): string {
  return createHash("sha256").update(clair).digest("hex");
}

/**
 * Comparaison a temps constant de deux empreintes.
 *
 * Une comparaison ordinaire (===) s'arrete au premier caractere different :
 * le temps de reponse renseigne alors sur le nombre de caracteres corrects.
 * Ici, la recherche se fait de toute facon par index unique, mais la fonction
 * existe pour tout code qui comparerait deux empreintes en memoire.
 */
export function empreintesEgales(a: string, b: string): boolean {
  const tamponA = Buffer.from(a, "hex");
  const tamponB = Buffer.from(b, "hex");
  if (tamponA.length !== tamponB.length) return false;
  return timingSafeEqual(tamponA, tamponB);
}

/** Date d'expiration a N jours d'ici. */
export function expirationDans(jours: number): Date {
  return new Date(Date.now() + jours * 24 * 60 * 60 * 1000);
}
