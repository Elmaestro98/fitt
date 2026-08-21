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
import { getSuperAdminContext } from "@/lib/super-admin";
import { normaliserTelephoneSalle } from "@/lib/utils/telephone";

/**
 * Cree la salle correspondant a l'organisation Clerk active, si elle n'existe
 * pas encore. Appelee juste apres la creation d'une organisation.
 *
 * Idempotente : un second appel ne cree pas de doublon (upsert). C'est
 * indispensable — l'utilisateur peut rafraichir la page, revenir en arriere,
 * ou deux onglets peuvent declencher l'appel en meme temps.
 *
 * /!\ REGLE : une salle qui vient de creer son organisation Clerk n'a PAS
 * acces au produit tant qu'AFRICATECHNOLOGIE ne l'a pas activee (§3 —
 * l'isolation multi-tenant prime, et l'acces par defaut a une salle jamais
 * verifiee est un risque, pas une commodite). D'ou actif:false explicite sur
 * la CREATION uniquement : une salle deja existante et resynchronisee garde
 * le statut que le Super Admin lui a donne, jamais reecrase.
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
    // Deja existante : on resynchronise juste le nom, jamais le statut.
    update: { nom: organisation.name },
    create: {
      clerkOrgId: orgId,
      nom: organisation.name,
      actif: false,
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

/* =============================================================================
   SUPER ADMIN — vue AFRICATECHNOLOGIE sur l'ensemble des salles clientes.

   Chaque fonction commence par getSuperAdminContext() plutot que
   getTenantContext() : aucun where ne filtre sur un gymId, precisement parce
   qu'il n'y en a pas un a filtrer — c'est le seul endroit du projet ou lire
   TOUTES les salles a la fois est le comportement voulu (§3, exception
   explicite et assumee, jamais accidentelle).
   ============================================================================= */

/** Toutes les salles clientes, les plus recentes en premier. */
export async function listerToutesLesSalles() {
  await getSuperAdminContext();

  return prisma.gym.findMany({
    orderBy: { creeLe: "desc" },
    include: { _count: { select: { adherents: true } } },
  });
}

/**
 * Active une salle, en posant activeeLe si c'est sa toute premiere fois.
 *
 * /!\ activeeLe ne s'ecrit qu'UNE fois (§9, meme logique que finLe sur
 * Abonnement — une valeur figee, jamais recalculee) : c'est ce qui distingue
 * ensuite, dans l'affichage, une salle qui n'a JAMAIS ete activee (en
 * attente) d'une salle qui l'a ete puis suspendue. Reactiver une salle deja
 * passee par la ne touche donc pas cette date.
 */
async function activerSalle(id: string) {
  const salle = await prisma.gym.findUnique({
    where: { id },
    select: { activeeLe: true },
  });
  if (!salle) throw new Error("Salle introuvable");

  await prisma.gym.updateMany({
    where: { id },
    data: { actif: true, activeeLe: salle.activeeLe ?? new Date() },
  });
}

/**
 * Suspend ou reactive une salle cliente (impaye, resiliation...).
 *
 * Une salle desactivee n'est pas supprimee : ses donnees restent intactes,
 * seul l'acces se ferme. SalleDesactiveeError (tenant.ts) bloque alors tout
 * le staff de cette salle des la prochaine requete.
 */
export async function basculerActivationSalle(id: string, actif: boolean) {
  await getSuperAdminContext();

  if (actif) {
    await activerSalle(id);
    return;
  }

  const resultat = await prisma.gym.updateMany({
    where: { id },
    data: { actif: false },
  });

  if (resultat.count === 0) throw new Error("Salle introuvable");
}

/**
 * Active la salle liee au compte Clerk d'un e-mail donne.
 *
 * Le Super Admin ne connait generalement pas l'id interne de la salle a
 * activer, seulement l'adresse du gerant qui vient de s'inscrire — d'ou ce
 * chemin par e-mail plutot que par id. On remonte : e-mail -> compte Clerk ->
 * organisations dont il est membre -> salle correspondante en base.
 */
export async function activerSalleParEmail(email: string) {
  await getSuperAdminContext();

  const clerk = await clerkClient();

  const { data: utilisateurs } = await clerk.users.getUserList({
    emailAddress: [email],
  });
  const utilisateur = utilisateurs[0];
  if (!utilisateur) {
    throw new Error("Aucun compte avec cet e-mail");
  }

  const { data: adhesions } = await clerk.users.getOrganizationMembershipList({
    userId: utilisateur.id,
  });
  if (adhesions.length === 0) {
    throw new Error("Ce compte n'appartient a aucune organisation");
  }

  const orgIds = adhesions.map((a) => a.organization.id);
  const salles = await prisma.gym.findMany({
    where: { clerkOrgId: { in: orgIds } },
  });

  if (salles.length === 0) {
    throw new Error(
      "Aucune salle Fitt trouvee pour ce compte (organisation pas encore initialisee)",
    );
  }
  if (salles.length > 1) {
    throw new Error(
      `Ce compte appartient a plusieurs salles (${salles.map((s) => s.nom).join(", ")}) — utilisez le tableau ci-dessous`,
    );
  }

  const salle = salles[0];
  await activerSalle(salle.id);
  return salle;
}

/**
 * La fiche detaillee d'une salle : coordonnees, statut, et le staff qui y a
 * acces — lu directement dans Clerk, puisque c'est la que vivent les comptes
 * et les roles du staff (§10 : aucun staff mirror en base).
 */
export async function detailSalle(id: string) {
  await getSuperAdminContext();

  const salle = await prisma.gym.findUnique({
    where: { id },
    include: {
      _count: {
        select: { adherents: true },
      },
    },
  });
  if (!salle) return null;

  const [abonnementsActifs, staff] = await Promise.all([
    prisma.abonnement.count({ where: { gymId: id, statut: "ACTIF" } }),
    (async () => {
      const clerk = await clerkClient();
      const { data } = await clerk.organizations.getOrganizationMembershipList({
        organizationId: salle.clerkOrgId,
      });
      return data.map((m) => ({
        id: m.id,
        nom:
          [m.publicUserData?.firstName, m.publicUserData?.lastName]
            .filter(Boolean)
            .join(" ") || "Sans nom",
        email: m.publicUserData?.identifier ?? "—",
        role: m.role === "org:admin" ? "Admin" : "Membre",
      }));
    })(),
  ]);

  return { salle, abonnementsActifs, staff };
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
