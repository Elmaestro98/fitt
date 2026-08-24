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
import { televerserLogoGym } from "@/lib/data/stockage";

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
  // Le champ est toujours pre-rempli (defaultValue) : ce schema ne voit un
  // vide que si le gerant efface tout deliberement, auquel cas l'erreur
  // "2 caracteres minimum" l'empeche d'enregistrer un prefixe vide.
  prefixeAdherent: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Lettres et chiffres uniquement, sans espace")
    .min(2, "2 caracteres minimum")
    .max(12, "12 caracteres maximum")
    .optional(),
});

export type ParametresSalle = z.infer<typeof schemaParametresSalle>;

/** Ce que le formulaire demande de faire du logo (meme principe
 *  qu'IntentionPhotoAdherent, lib/data/adherent.ts). */
export type IntentionLogoGym =
  | { action: "inchangee" }
  | { action: "remplacee"; fichier: File }
  | { action: "retiree" };

export async function modifierParametresSalle(
  donnees: ParametresSalle,
  logo: IntentionLogoGym = { action: "inchangee" },
) {
  const { gymId } = await getTenantContext();

  // Le televersement a lieu AVANT l'ecriture, hors de toute transaction —
  // meme raison que creerAdherent/creerProduit : ne pas immobiliser une
  // connexion du pool pendant l'appel reseau vers Supabase Storage.
  const logoUrl =
    logo.action === "remplacee"
      ? await televerserLogoGym(gymId, logo.fichier)
      : null;

  // updateMany plutot qu'update : meme raison que partout ailleurs, le where
  // reste libre. Ici l'id vient deja du tenant, mais on garde la forme pour
  // que le jour ou un critere s'ajoute, personne n'ait a y repenser.
  const resultat = await prisma.gym.updateMany({
    where: { id: gymId },
    data: {
      telephone: donnees.telephone || null,
      adresse: donnees.adresse || null,
      ville: donnees.ville || null,
      ...(donnees.prefixeAdherent ? { prefixeAdherent: donnees.prefixeAdherent } : {}),
      // Champ volontairement absent quand le logo est inchange : l'omettre
      // laisse la valeur en base, alors que logoUrl: null l'effacerait.
      ...(logo.action === "remplacee" ? { logoUrl } : {}),
      ...(logo.action === "retiree" ? { logoUrl: null } : {}),
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
/* --- Essai et abonnement (Super Admin) ------------------------------------
   Ces trois fonctions decrivent la relation commerciale entre une SALLE et
   AFRICATECHNOLOGIE. A ne pas confondre avec data/abonnement.ts, qui gere le
   contrat d'un ADHERENT envers sa salle. */

/** Bornes de securite sur la duree d'un essai. Le maximum evite qu'une faute
 *  de frappe (300 au lieu de 30) n'offre dix mois gratuits sans que personne
 *  ne s'en apercoive. */
export const JOURS_ESSAI_MIN = 1;
export const JOURS_ESSAI_MAX = 180;

/**
 * Accorde ou prolonge un essai.
 *
 * Prolonge depuis la date de fin EXISTANTE quand l'essai court encore, depuis
 * aujourd'hui quand il est deja expire. Sans cela, prolonger de 14 jours une
 * salle a qui il en restait 10 ne lui en donnerait que 14 — on lui volerait
 * les 10 restants.
 */
export async function accorderEssai(id: string, jours: number) {
  await getSuperAdminContext();

  if (!Number.isInteger(jours) || jours < JOURS_ESSAI_MIN || jours > JOURS_ESSAI_MAX) {
    throw new Error(`La duree doit etre comprise entre ${JOURS_ESSAI_MIN} et ${JOURS_ESSAI_MAX} jours`);
  }

  const salle = await prisma.gym.findUnique({
    where: { id },
    select: { essaiJusquau: true },
  });
  if (!salle) throw new Error("Salle introuvable");

  const maintenant = new Date();
  const depart =
    salle.essaiJusquau && salle.essaiJusquau > maintenant
      ? salle.essaiJusquau
      : maintenant;

  const fin = new Date(depart.getTime() + jours * 24 * 60 * 60 * 1000);

  await prisma.gym.updateMany({
    where: { id },
    // Accorder un essai remet forcement la salle en essai : sinon, prolonger
    // une salle marquee abonnee n'aurait aucun effet visible.
    data: { essaiJusquau: fin, abonnee: false },
  });

  return fin;
}

/**
 * Bascule entre "cliente payante" et "en essai".
 *
 * On n'efface JAMAIS essaiJusquau en marquant une salle abonnee : la date
 * raconte quand son essai s'est termine, et cette information a de la valeur
 * commerciale ("elle a paye au bout de combien de jours ?"). C'est abonnee
 * qui prime dans la regle d'acces, pas l'absence de date.
 */
export async function definirAbonnementSalle(id: string, abonnee: boolean) {
  await getSuperAdminContext();

  const resultat = await prisma.gym.updateMany({
    where: { id },
    data: { abonnee },
  });

  if (resultat.count === 0) throw new Error("Salle introuvable");
}

/** Retire toute limite sans marquer la salle payante — le cas des salles
 *  temoins ou partenaires, qu'on ne veut ni facturer ni compter comme
 *  clientes dans les chiffres. */
export async function retirerEssai(id: string) {
  await getSuperAdminContext();

  const resultat = await prisma.gym.updateMany({
    where: { id },
    data: { essaiJusquau: null },
  });

  if (resultat.count === 0) throw new Error("Salle introuvable");
}

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

  if (salles.length > 1) {
    throw new Error(
      `Ce compte appartient a plusieurs salles (${salles.map((s) => s.nom).join(", ")}) — utilisez le tableau ci-dessous`,
    );
  }

  if (salles.length === 1) {
    await activerSalle(salles[0].id);
    return { salle: salles[0], creee: false };
  }

  // --- Aucune salle en base, mais l'organisation existe dans Clerk ---------
  //
  // Cas courant : l'organisation a ete creee dans le tableau de bord Clerk,
  // ou son gerant ne s'est pas encore connecte. Fitt n'enregistre une salle
  // qu'au premier chargement de l'application (synchroniserSalleDepuisClerk),
  // ce qui produisait un blocage circulaire : le Super Admin ne pouvait pas
  // activer tant que le gerant ne s'etait pas connecte, et le gerant tombait
  // sur "Acces non active" sans comprendre quoi faire.
  //
  // On cree donc la salle ici, deja activee. Le nom vient de Clerk, jamais
  // d'une saisie : c'est la meme source que synchroniserSalleDepuisClerk.
  if (adhesions.length > 1) {
    const noms = adhesions.map((a) => a.organization.name).join(", ");
    throw new Error(
      `Ce compte appartient a plusieurs organisations (${noms}) — demandez au gerant de se connecter une fois, la salle apparaitra dans le tableau`,
    );
  }

  const organisation = adhesions[0].organization;
  const salle = await prisma.gym.create({
    data: {
      clerkOrgId: organisation.id,
      nom: organisation.name,
      actif: true,
      activeeLe: new Date(),
    },
  });

  return { salle, creee: true };
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
