// =============================================================================
// LE point d'entree du multi-tenant. CLAUDE.md §3.
//
// Toute fonction qui lit ou ecrit des donnees metier commence par appeler
// getTenantContext(), et filtre ensuite sur le gymId qu'elle renvoie.
//
// Le gymId n'est JAMAIS lu depuis une URL, un formulaire, un header ou un body :
// tout cela est modifiable par l'utilisateur. La seule source fiable est le
// cookie de session, signe cryptographiquement par Clerk.
// =============================================================================

// Fait echouer la compilation si ce fichier est importe depuis un composant
// client. Sans cette ligne, une erreur d'import enverrait la logique de tenant
// dans le navigateur.
import "server-only";

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { etatAccesSalle } from "@/lib/utils/acces-salle";
import type { GymModel } from "@/generated/prisma/models";

export type ContexteTenant = {
  /** L'identifiant de la salle. C'est LUI qui filtre toutes les requetes. */
  gymId: string;
  /** La salle complete, si on a besoin de son nom, sa ville, etc. */
  gym: GymModel;
  /** L'utilisateur Clerk connecte (un membre du staff). */
  userId: string;
  /** Son role dans cette salle : "org:admin", "org:member"... */
  orgRole: string | null;
};

/** Aucune session : l'utilisateur n'est pas connecte. */
export class NonAuthentifieError extends Error {
  constructor() {
    super("Non authentifie");
    this.name = "NonAuthentifieError";
  }
}

/** Connecte, mais aucune organisation active dans la session. */
export class AucuneSalleActiveError extends Error {
  constructor() {
    super("Aucune salle active");
    this.name = "AucuneSalleActiveError";
  }
}

/** L'organisation Clerk existe, mais aucune ligne `gyms` ne lui correspond. */
export class SalleIntrouvableError extends Error {
  constructor(public readonly clerkOrgId: string) {
    super("Salle introuvable");
    this.name = "SalleIntrouvableError";
  }
}

/** La salle existe mais a ete desactivee (resiliation, impaye). */
export class SalleDesactiveeError extends Error {
  constructor() {
    super("Salle desactivee");
    this.name = "SalleDesactiveeError";
  }
}

/** Distinct de SalleDesactiveeError : ici la salle n'a rien fait de mal, sa
 *  periode d'essai est simplement terminee. Le message a lui montrer n'est
 *  pas le meme, et l'action attendue non plus. */
export class EssaiExpireError extends Error {
  constructor(public readonly finLe: Date) {
    super("Periode d'essai terminee");
    this.name = "EssaiExpireError";
  }
}

// cache() de React : une page appelle getTenantContext() une fois par
// fonction de lib/data/* qui en a besoin, parfois cinq ou six fois. Sans ce
// cache, chacun de ces appels refaisait un aller-retour vers la base
// (elle-meme distante, chez Supabase) pour relire exactement la meme ligne
// `gyms`. cache() memorise le resultat pour la duree d'un seul rendu ou d'une
// seule Server Action : le premier appel interroge la base, les suivants
// reutilisent la reponse.
export const getTenantContext = cache(async (): Promise<ContexteTenant> => {
  // 1. Qui est connecte ? Lecture du cookie de session signe par Clerk.
  const { userId, orgId, orgRole } = await auth();

  if (!userId) throw new NonAuthentifieError();

  // 2. A quelle salle appartient-il ? Une session sans organisation active
  //    n'a acces a aucune donnee metier.
  if (!orgId) throw new AucuneSalleActiveError();

  // 3. Traduction organisation Clerk -> salle en base, via le pont clerkOrgId.
  const gym = await prisma.gym.findUnique({ where: { clerkOrgId: orgId } });

  if (!gym) throw new SalleIntrouvableError(orgId);

  // 4. La salle a-t-elle le droit d'utiliser Fitt aujourd'hui ? Regle unique,
  //    partagee avec l'espace adherent (lib/utils/acces-salle.ts).
  const etat = etatAccesSalle(gym);
  if (etat === "essai-expire") {
    throw new EssaiExpireError(gym.essaiJusquau!);
  }
  if (etat !== "ouvert") throw new SalleDesactiveeError();

  return { gymId: gym.id, gym, userId, orgRole: orgRole ?? null };
});
