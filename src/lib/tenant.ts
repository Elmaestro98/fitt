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

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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

export async function getTenantContext(): Promise<ContexteTenant> {
  // 1. Qui est connecte ? Lecture du cookie de session signe par Clerk.
  const { userId, orgId, orgRole } = await auth();

  if (!userId) throw new NonAuthentifieError();

  // 2. A quelle salle appartient-il ? Une session sans organisation active
  //    n'a acces a aucune donnee metier.
  if (!orgId) throw new AucuneSalleActiveError();

  // 3. Traduction organisation Clerk -> salle en base, via le pont clerkOrgId.
  const gym = await prisma.gym.findUnique({ where: { clerkOrgId: orgId } });

  if (!gym) throw new SalleIntrouvableError(orgId);
  if (!gym.actif) throw new SalleDesactiveeError();

  return { gymId: gym.id, gym, userId, orgRole: orgRole ?? null };
}
