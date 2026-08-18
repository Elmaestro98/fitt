// Acces aux donnees de la table `gyms` (CLAUDE.md §7 : un fichier par entite).
//
// Cas particulier : `Gym` est la SEULE table qui ne porte pas de colonne gymId,
// puisqu'elle EST le tenant. Toutes les autres devront filtrer dessus.
import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Cree la salle correspondant a l'organisation Clerk active, si elle n'existe
 * pas encore. Appelee juste apres la creation d'une organisation.
 *
 * Idempotente : un second appel ne cree pas de doublon (upsert). C'est
 * indispensable — l'utilisateur peut rafraichir la page, revenir en arriere,
 * ou deux onglets peuvent declencher l'appel en meme temps.
 */
export async function synchroniserSalleDepuisClerk() {
  const { userId, orgId } = await auth();

  if (!userId) throw new Error("Non authentifie");
  if (!orgId) throw new Error("Aucune salle active");

  // On lit le nom de l'organisation cote serveur, via l'API Clerk.
  // Surtout pas depuis un formulaire : ce serait laisser l'utilisateur
  // renommer arbitrairement une salle qui n'est peut-etre pas la sienne.
  const clerk = await clerkClient();
  const organisation = await clerk.organizations.getOrganization({
    organizationId: orgId,
  });

  return prisma.gym.upsert({
    where: { clerkOrgId: orgId },
    // Deja existante : on resynchronise juste le nom s'il a change dans Clerk.
    update: { nom: organisation.name },
    create: {
      clerkOrgId: orgId,
      nom: organisation.name,
    },
  });
}
