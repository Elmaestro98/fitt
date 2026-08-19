// =============================================================================
// Lectures de l'espace adherent (CLAUDE.md §7 : un fichier par domaine).
//
// Ce fichier est le pendant, cote adherent, de data/abonnement.ts et
// data/pointage.ts. Il existe separement pour une raison precise : les
// fonctions de ces fichiers-la commencent toutes par getTenantContext(), qui
// lit la session CLERK. Un adherent n'en a pas, et n'en aura jamais (§5, §9).
//
// La regle du §3 est respectee a l'identique, avec une autre source :
//   back-office : gymId <- session Clerk        (getTenantContext)
//   espace      : gymId <- session adherent     (exigerSessionAdherent)
//
// Aucune fonction d'ici n'accepte d'adherentId ni de gymId en parametre. Un
// adherent ne peut donc pas demander les seances d'un autre, meme en forgeant
// la requete : il n'y a aucun parametre a forger.
// =============================================================================
import "server-only";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { exigerSessionAdherent } from "@/lib/session-adherent";

/** Debut de la journee en cours. Dakar est a UTC+0 toute l'annee (§8). */
function debutDuJour() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Debut du mois en cours, pour le compteur de seances. */
function debutDuMois() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/**
 * Tout ce qu'affiche l'accueil de l'espace, en une fois.
 *
 * /!\ finLe est lue telle quelle, jamais recalculee a partir de la formule
 * (§9) : le tarif ou la duree de la formule ont pu changer depuis, et la date
 * de fin a ete figee a la souscription. La recalculer corromprait
 * retroactivement l'abonnement en cours.
 */
export async function accueilEspace() {
  const session = await exigerSessionAdherent();
  const { gymId, adherentId } = session;
  const maintenant = new Date();

  const [abonnement, seancesCeMois, derniereSeance, seancesAujourdhui] =
    await Promise.all([
      prisma.abonnement.findFirst({
        where: { gymId, adherentId, statut: "ACTIF", finLe: { gte: maintenant } },
        orderBy: { finLe: "desc" },
        select: { nomFormule: true, debutLe: true, finLe: true },
      }),
      prisma.pointage.count({
        where: { gymId, adherentId, horodatage: { gte: debutDuMois() } },
      }),
      prisma.pointage.findFirst({
        where: { gymId, adherentId },
        orderBy: { horodatage: "desc" },
        select: { horodatage: true },
      }),
      // Sert au bouton de pointage : deja venu aujourd'hui ou non.
      prisma.pointage.count({
        where: { gymId, adherentId, horodatage: { gte: debutDuJour() } },
      }),
    ]);

  return {
    adherent: session.adherent,
    gym: session.gym,
    abonnement,
    seancesCeMois,
    derniereSeance: derniereSeance?.horodatage ?? null,
    dejaPointeAujourdhui: seancesAujourdhui > 0,
  };
}

export type AccueilEspace = Awaited<ReturnType<typeof accueilEspace>>;

/**
 * Les seances de l'adherent, de la plus recente a la plus ancienne.
 *
 * statutAdherent n'est pas renvoye : c'est une donnee de gestion interne, et
 * rappeler a quelqu'un qu'il etait "EXPIRE" a chacune de ses visites n'a
 * aucun interet pour lui.
 */
export async function seancesEspace(limite = 30) {
  const { gymId, adherentId } = await exigerSessionAdherent();

  const [seances, total] = await Promise.all([
    prisma.pointage.findMany({
      where: { gymId, adherentId },
      orderBy: { horodatage: "desc" },
      take: limite,
      select: { id: true, horodatage: true, source: true },
    }),
    prisma.pointage.count({ where: { gymId, adherentId } }),
  ]);

  return { seances, total };
}

/** L'historique des abonnements, tel que l'adherent peut le consulter. */
export async function abonnementsEspace() {
  const { gymId, adherentId } = await exigerSessionAdherent();

  return prisma.abonnement.findMany({
    where: { gymId, adherentId },
    orderBy: { debutLe: "desc" },
    take: 20,
    select: {
      id: true,
      nomFormule: true,
      debutLe: true,
      finLe: true,
      statut: true,
      prixPaye: true,
    },
  });
}

/* --- Auto-pointage --------------------------------------------------------- */

/** Meme fenetre que la borne : deux passages a moins de 2 minutes n'en font
 *  qu'un. Un adherent qui appuie deux fois ne compte pas double. */
const FENETRE_ANTI_REBOND_MS = 2 * 60 * 1000;

export type ResultatAutoPointage =
  | { ok: true; deja: boolean }
  | { ok: false; raison: "aucun-code" | "code-faux" };

/**
 * Enregistre la presence de l'adherent, sur presentation du code du jour.
 *
 * /!\ Le code est ce qui rend ce pointage credible : il n'est affiche que sur
 * la borne d'accueil, il change chaque jour, et le gerant peut le renouveler
 * a tout moment. Sans lui, n'importe qui pointerait de chez lui et le registre
 * de la salle perdrait toute valeur.
 *
 * L'abonnement n'est PAS verifie : un adherent expire qui vient quand meme est
 * un passage a enregistrer, pas a refuser (§9 — on ne bloque pas la porte). Le
 * statut du jour est photographie dans la ligne, comme le fait la borne.
 */
export async function pointerDepuisEspace(
  codeSaisi: string,
): Promise<ResultatAutoPointage> {
  const { gymId, adherentId, adherent } = await exigerSessionAdherent();

  // Le code est relu en base a chaque tentative : celui affiche il y a une
  // heure a pu etre renouvele entre-temps.
  const salle = await prisma.gym.findUnique({
    where: { id: gymId },
    select: { codePointage: true, codePointageLe: true },
  });

  const codeDuJour =
    salle?.codePointage && estAujourdhui(salle.codePointageLe)
      ? salle.codePointage
      : null;

  if (!codeDuJour) return { ok: false, raison: "aucun-code" };

  // Les chiffres seulement : un adherent qui recopie "12 34" doit passer.
  if (codeSaisi.replace(/\D/g, "") !== codeDuJour) {
    return { ok: false, raison: "code-faux" };
  }

  const recent = await prisma.pointage.findFirst({
    where: {
      gymId,
      adherentId,
      horodatage: { gte: new Date(Date.now() - FENETRE_ANTI_REBOND_MS) },
    },
    select: { id: true },
  });

  // Deja pointe il y a moins de deux minutes : on repond "c'est bon" plutot
  // qu'une erreur. Pour l'adherent, sa presence EST enregistree.
  if (recent) return { ok: true, deja: true };

  await prisma.pointage.create({
    data: {
      gymId,
      adherentId,
      horodatage: new Date(),
      source: "ADHERENT",
      // Photographie du statut, comme la borne (§9).
      statutAdherent: adherent.statut,
      // Meme role que la cle de la borne : rendre l'ecriture idempotente si
      // le telephone renvoie la requete sur un reseau instable.
      cleLocale: randomUUID(),
    },
  });

  return { ok: true, deja: false };
}

/** Dakar est a UTC+0 toute l'annee (§8). */
function estAujourdhui(date: Date | null): boolean {
  if (!date) return false;
  const maintenant = new Date();
  return (
    date.getUTCFullYear() === maintenant.getUTCFullYear() &&
    date.getUTCMonth() === maintenant.getUTCMonth() &&
    date.getUTCDate() === maintenant.getUTCDate()
  );
}
