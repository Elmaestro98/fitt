// Acces aux donnees de la table `gyms` (CLAUDE.md §7 : un fichier par entite).
//
// Cas particulier : `Gym` est la SEULE table qui ne porte pas de colonne gymId,
// puisqu'elle EST le tenant. Toutes les autres devront filtrer dessus.
import "server-only";

import { randomInt } from "node:crypto";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { normaliserTelephoneSalle } from "@/lib/utils/telephone";

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

/* --- Parametres de la salle ---------------------------------------------- */

/**
 * La salle courante, telle qu'affichee dans les parametres.
 *
 * Aucun identifiant en parametre : getTenantContext resout la salle depuis la
 * session. Il n'existe donc aucun moyen, meme en forgeant une requete, de lire
 * les parametres d'une autre salle (§3).
 */
export async function parametresSalle() {
  const { gym } = await getTenantContext();
  return gym;
}

/* Le nom NE figure PAS dans ce schema, volontairement.
   Il appartient a l'organisation Clerk, et synchroniserSalleDepuisClerk le
   reecrit depuis Clerk a chaque passage sur /salle/initialisation. Le rendre
   modifiable ici produirait une modification silencieusement annulee un jour
   ou l'autre — le pire des comportements. Il se change dans Clerk. */
export const schemaParametresSalle = z.object({
  // Vider le champ efface le numero ; une saisie non vide doit etre valide.
  // Les deux cas se ressemblent apres transformation (null dans les deux),
  // d'ou le signalement explicite plutot qu'un refine sur le resultat.
  telephone: z
    .string()
    .trim()
    .transform((valeur, ctx) => {
      if (valeur === "") return null;

      const normalise = normaliserTelephoneSalle(valeur);
      if (!normalise) {
        ctx.addIssue({
          code: "custom",
          message:
            "Numero senegalais invalide (ex : 33 823 45 67 ou 77 123 45 67)",
        });
        return z.NEVER;
      }
      return normalise;
    })
    .optional(),
  adresse: z.string().trim().max(200).optional(),
  ville: z.string().trim().max(80).optional(),
});

export type ParametresSalle = z.infer<typeof schemaParametresSalle>;

export async function modifierParametresSalle(donnees: ParametresSalle) {
  const { gymId } = await getTenantContext();

  // updateMany plutot qu'update : meme raison que partout ailleurs, le where
  // reste libre. Ici l'id vient deja du tenant, mais on garde la forme pour
  // que le jour ou un critere s'ajoute, personne n'ait a y repenser.
  const resultat = await prisma.gym.updateMany({
    where: { id: gymId },
    data: {
      telephone: donnees.telephone || null,
      adresse: donnees.adresse || null,
      ville: donnees.ville || null,
    },
  });

  if (resultat.count === 0) throw new Error("Salle introuvable");
}

/* --- Code de seance du jour ----------------------------------------------- */

/**
 * Le code a 4 chiffres affiche sur la borne d'accueil, tire une fois par jour.
 *
 * C'est ce code que l'adherent recopie dans son espace pour signaler sa
 * presence. Il ne protege aucune donnee — il atteste seulement que la personne
 * a vu l'ecran de l'accueil, donc qu'elle est physiquement dans la salle.
 * Sans lui, l'auto-pointage se ferait depuis le canape et le registre de la
 * salle ne vaudrait plus rien.
 *
 * Genere paresseusement : il n'existe que si quelqu'un l'a demande, c'est-a-
 * dire si la borne a ete ouverte. Une salle qui n'affiche pas de code n'a
 * simplement pas d'auto-pointage ce jour-la, et c'est le comportement voulu.
 */
export async function codeSeanceDuJour(): Promise<string> {
  const { gymId, gym } = await getTenantContext();

  if (gym.codePointage && estAujourdhui(gym.codePointageLe)) {
    return gym.codePointage;
  }

  const code = tirerCode();

  await prisma.gym.update({
    where: { id: gymId },
    data: { codePointage: code, codePointageLe: new Date() },
  });

  return code;
}

/**
 * Tire un nouveau code immediatement, sans attendre le lendemain.
 *
 * Le cas d'usage est simple et reel : le code a ete photographie et fait le
 * tour d'un groupe WhatsApp. Le gerant le change, et les absents ne peuvent
 * plus pointer.
 */
export async function renouvelerCodeSeance(): Promise<string> {
  const { gymId } = await getTenantContext();
  const code = tirerCode();

  await prisma.gym.update({
    where: { id: gymId },
    data: { codePointage: code, codePointageLe: new Date() },
  });

  return code;
}

/** Dakar est a UTC+0 toute l'annee : la comparaison UTC est la bonne (§8). */
function estAujourdhui(date: Date | null): boolean {
  if (!date) return false;
  const maintenant = new Date();
  return (
    date.getUTCFullYear() === maintenant.getUTCFullYear() &&
    date.getUTCMonth() === maintenant.getUTCMonth() &&
    date.getUTCDate() === maintenant.getUTCDate()
  );
}

/* randomInt et pas Math.random : le code est court, autant qu'il ne soit pas
   previsible a partir de celui de la veille. Le cout est nul. */
function tirerCode(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}
