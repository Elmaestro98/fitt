// =============================================================================
// LE point d'entree du multi-tenant COTE ADHERENT. Le pendant exact de
// lib/tenant.ts, mais pour l'autre population (CLAUDE.md §5).
//
//   Staff     -> lib/tenant.ts          -> session Clerk        -> gymId
//   Adherent  -> ce fichier             -> cookie maison        -> gymId
//
// Le principe est identique et non negociable : le gymId ne vient JAMAIS
// d'une URL, d'un formulaire, d'un header ou d'un body (§3, §9). Il vient de
// la ligne sessions_adherent designee par l'empreinte du jeton du cookie.
//
// Consequence directe, et c'est la reponse a "un espace par salle" : il n'y a
// aucune salle dans l'URL de l'espace adherent, et il ne peut pas y en avoir.
// Un adherent de la salle A ne peut pas atteindre la salle B, meme en
// bricolant l'adresse — il n'y a rien a bricoler.
// =============================================================================

// Fait echouer la compilation si ce fichier part dans le navigateur.
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  fermerSession,
  JOURS_SESSION,
  lireSessionAdherent,
} from "@/lib/data/espace-adherent";

/** Nom du cookie de session adherent.
 *
 *  Prefixe distinct de tout cookie Clerk : les deux populations peuvent
 *  cohabiter dans le meme navigateur — le gerant qui teste l'espace de sa
 *  salle depuis son propre telephone est un cas courant, pas un cas limite. */
export const COOKIE_SESSION_ADHERENT = "fitt_adherent";

export type ContexteAdherent = NonNullable<
  Awaited<ReturnType<typeof lireSessionAdherent>>
>;

/**
 * La session adherent en cours, ou null.
 *
 * A utiliser quand l'absence de session est un cas normal (une page qui
 * s'affiche differemment selon qu'on est connecte ou non).
 */
export async function getSessionAdherent(): Promise<ContexteAdherent | null> {
  const jeton = (await cookies()).get(COOKIE_SESSION_ADHERENT)?.value;
  if (!jeton) return null;

  return lireSessionAdherent(jeton);
}

/**
 * La session adherent, ou une redirection vers la page d'accueil de l'espace.
 *
 * C'est la fonction que toutes les pages de /espace appellent en premiere
 * ligne, avant toute logique metier — exactement comme getTenantContext()
 * cote back-office.
 *
 * /!\ Le cookie n'est pas efface ici : redirect() interrompt le rendu, et un
 * Server Component n'a de toute facon pas le droit d'ecrire un cookie. Un
 * jeton perime est sans valeur, le laisser trainer ne coute rien.
 */
export async function exigerSessionAdherent(): Promise<ContexteAdherent> {
  const session = await getSessionAdherent();
  if (!session) redirect("/espace/acces");
  return session;
}

/* --- Ecriture du cookie ----------------------------------------------------
   /!\ Ces deux fonctions ne sont appelables QUE depuis une Server Action ou
   un Route Handler. Next.js interdit d'ecrire un cookie pendant le rendu
   d'une page, et c'est une bonne chose : cela force l'activation d'un lien a
   etre un acte volontaire de l'adherent, pas un effet de bord du chargement
   de la page (voir verifierInvitation). */

export async function deposerCookieSession(jetonClair: string) {
  (await cookies()).set(COOKIE_SESSION_ADHERENT, jetonClair, {
    // Inaccessible au JavaScript de la page : un XSS ne peut pas voler la
    // session.
    httpOnly: true,
    // En clair sur le reseau local en dev, chiffre partout ailleurs.
    secure: process.env.NODE_ENV === "production",
    // "lax" et pas "strict" : le lien arrive par WhatsApp, donc d'un autre
    // site. En "strict", le cookie ne serait pas envoye au premier clic et
    // l'adherent verrait un ecran de deconnexion juste apres s'etre connecte.
    sameSite: "lax",
    path: "/",
    maxAge: JOURS_SESSION * 24 * 60 * 60,
  });
}

export async function supprimerCookieSession() {
  const boite = await cookies();
  const jeton = boite.get(COOKIE_SESSION_ADHERENT)?.value;

  // La session est d'abord fermee EN BASE : supprimer le cookie sans cela
  // laisserait une session vivante, reutilisable par quiconque detiendrait
  // encore le jeton.
  if (jeton) await fermerSession(jeton);

  boite.delete(COOKIE_SESSION_ADHERENT);
}
