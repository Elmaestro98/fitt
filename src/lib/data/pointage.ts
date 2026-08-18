// Acces aux donnees du pointage (CLAUDE.md §7 : un fichier par entite).
//
// /!\ Tout ici est ecrit pour un seul objectif : que la borne d'entree
// continue de fonctionner quand la connexion tombe (§9). D'ou deux partis
// pris inhabituels :
//   - le kiosque recoit d'un coup la liste des adherents, et cherche en local ;
//   - l'ecriture accepte un LOT de passages, pas un seul, parce que la file
//     locale se rejoue en bloc au retour du reseau.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

/** Anti-rebond : deux passages du meme adherent a moins de 2 minutes n'en
 *  font qu'un. Un adherent qui repasse sa carte parce qu'il n'a pas vu
 *  l'ecran ne doit pas compter double. */
const FENETRE_ANTI_REBOND_MS = 2 * 60 * 1000;

/* --- Le instantane envoye a la borne --------------------------------------- */

/**
 * Liste des adherents pointables, avec l'echeance de leur abonnement en cours.
 *
 * Envoyee en une fois au kiosque, qui cherche ensuite EN LOCAL. C'est ce qui
 * permet a la borne de continuer a identifier les adherents sans reseau — et
 * accessoirement de repondre instantanement a la frappe.
 *
 * Les archives sont exclues : elles ne franchissent plus la porte.
 */
export async function adherentsPourKiosque() {
  const { gymId } = await getTenantContext();

  const adherents = await prisma.adherent.findMany({
    where: { gymId, statut: { not: "ARCHIVE" } },
    orderBy: { prenom: "asc" },
    select: {
      id: true,
      numero: true,
      prenom: true,
      nom: true,
      telephone: true,
      photoUrl: true,
      statut: true,
      // L'abonnement en cours, s'il existe : c'est lui qui donne les jours
      // restants affiches a l'ecran.
      abonnements: {
        where: { statut: "ACTIF", finLe: { gte: new Date() } },
        orderBy: { finLe: "desc" },
        take: 1,
        select: { finLe: true, nomFormule: true },
      },
    },
  });

  return adherents.map((a) => ({
    id: a.id,
    numero: a.numero,
    prenom: a.prenom,
    nom: a.nom,
    telephone: a.telephone,
    photoUrl: a.photoUrl,
    statut: a.statut,
    finLe: a.abonnements[0]?.finLe ?? null,
    nomFormule: a.abonnements[0]?.nomFormule ?? null,
  }));
}

export type AdherentKiosque = Awaited<
  ReturnType<typeof adherentsPourKiosque>
>[number];

/* --- Ecriture -------------------------------------------------------------- */

export const schemaPointage = z.object({
  // Genere par la borne (crypto.randomUUID) AVANT tout appel reseau.
  cleLocale: z.string().min(8).max(64),
  adherentId: z.string().min(1),
  horodatage: z.coerce.date(),
  source: z.enum(["KIOSQUE", "STAFF"]).default("KIOSQUE"),
});

// Un lot : la file locale peut avoir accumule plusieurs passages pendant la
// coupure. Plafonne pour qu'une file corrompue ne puisse pas noyer la base.
export const schemaLotPointages = z.array(schemaPointage).min(1).max(200);

export type EntreePointage = z.infer<typeof schemaPointage>;

/**
 * Enregistre un lot de passages. Idempotent.
 *
 * Rejouer deux fois la meme file est sans effet : la contrainte unique
 * (gymId, cleLocale) fait que le second passage est ignore, pas duplique.
 * C'est pour cela que la borne peut vider sa file des qu'elle recoit une
 * reponse, sans craindre d'avoir tout enregistre en double.
 *
 * Retourne les cles traitees — celles que la borne peut oublier.
 */
export async function enregistrerPointages(entrees: EntreePointage[]) {
  const { gymId } = await getTenantContext();

  // Deduplication a l'interieur du lot lui-meme, avant tout acces base.
  const parCle = new Map(entrees.map((e) => [e.cleLocale, e]));
  const lot = [...parCle.values()];

  const idsDemandes = [...new Set(lot.map((e) => e.adherentId))];

  // Les adherents appartiennent-ils a CETTE salle ? Aucune confiance a des
  // identifiants qui ont sejourne dans le navigateur d'une borne.
  const adherents = await prisma.adherent.findMany({
    where: { gymId, id: { in: idsDemandes }, statut: { not: "ARCHIVE" } },
    select: { id: true, statut: true },
  });
  const statutParId = new Map(adherents.map((a) => [a.id, a.statut]));

  const valides = lot.filter((e) => statutParId.has(e.adherentId));
  const rejetes = lot
    .filter((e) => !statutParId.has(e.adherentId))
    .map((e) => e.cleLocale);

  if (valides.length === 0) {
    return { enregistres: 0, cles: rejetes, ignores: 0 };
  }

  // Anti-rebond : on regarde ce qui existe deja autour des horodatages du lot.
  const plusAncien = new Date(
    Math.min(...valides.map((e) => e.horodatage.getTime())) -
      FENETRE_ANTI_REBOND_MS,
  );

  const recents = await prisma.pointage.findMany({
    where: {
      gymId,
      adherentId: { in: idsDemandes },
      horodatage: { gte: plusAncien },
    },
    select: { adherentId: true, horodatage: true },
  });

  // Les passages deja acceptes dans ce meme lot comptent aussi : deux
  // scans a dix secondes d'intervalle pendant la coupure ne font qu'une
  // entree.
  const connus = recents.map((p) => ({
    adherentId: p.adherentId,
    ms: p.horodatage.getTime(),
  }));

  const aCreer: EntreePointage[] = [];
  const ignores: string[] = [];

  for (const entree of valides.sort(
    (a, b) => a.horodatage.getTime() - b.horodatage.getTime(),
  )) {
    const ms = entree.horodatage.getTime();
    const rebond = connus.some(
      (c) =>
        c.adherentId === entree.adherentId &&
        Math.abs(c.ms - ms) < FENETRE_ANTI_REBOND_MS,
    );

    if (rebond) {
      ignores.push(entree.cleLocale);
      continue;
    }

    connus.push({ adherentId: entree.adherentId, ms });
    aCreer.push(entree);
  }

  let enregistres = 0;
  if (aCreer.length > 0) {
    const resultat = await prisma.pointage.createMany({
      data: aCreer.map((e) => ({
        gymId,
        adherentId: e.adherentId,
        horodatage: e.horodatage,
        source: e.source,
        // Photographie du statut au moment du passage.
        statutAdherent: statutParId.get(e.adherentId)!,
        cleLocale: e.cleLocale,
      })),
      // La file rejouee retombe ici sans faire d'erreur : c'est le filet
      // d'idempotence, au niveau de la base.
      skipDuplicates: true,
    });
    enregistres = resultat.count;
  }

  return {
    enregistres,
    // Toutes les cles traitees, quelle qu'en soit l'issue : la borne peut les
    // retirer de sa file. Un rejet ou un rebond n'est pas une erreur a
    // reessayer indefiniment.
    cles: [...rejetes, ...ignores, ...aCreer.map((e) => e.cleLocale)],
    ignores: ignores.length,
  };
}

/* --- Lectures -------------------------------------------------------------- */

/** Debut de la journee en cours (Dakar est a UTC+0 toute l'annee). */
function debutDuJour() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Les derniers passages, pour la colonne de droite de la borne. */
export async function derniersPassages(limite = 12) {
  const { gymId } = await getTenantContext();

  return prisma.pointage.findMany({
    where: { gymId },
    orderBy: { horodatage: "desc" },
    take: limite,
    select: {
      id: true,
      horodatage: true,
      statutAdherent: true,
      source: true,
      adherent: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          numero: true,
          photoUrl: true,
        },
      },
    },
  });
}

/** Compteurs de la journee affiches au-dessus de la borne. */
export async function statistiquesPointage() {
  const { gymId } = await getTenantContext();
  const jour = debutDuJour();

  const [passages, distincts, expires] = await Promise.all([
    prisma.pointage.count({ where: { gymId, horodatage: { gte: jour } } }),
    // Un adherent qui vient matin et soir compte pour une personne.
    prisma.pointage
      .findMany({
        where: { gymId, horodatage: { gte: jour } },
        select: { adherentId: true },
        distinct: ["adherentId"],
      })
      .then((l) => l.length),
    prisma.pointage.count({
      where: {
        gymId,
        horodatage: { gte: jour },
        statutAdherent: { in: ["EXPIRE", "SUSPENDU"] },
      },
    }),
  ]);

  return { passages, distincts, expires };
}

/** Historique des passages d'un adherent, pour sa fiche. */
export async function pointagesAdherent(adherentId: string, limite = 20) {
  const { gymId } = await getTenantContext();

  const [passages, total] = await Promise.all([
    prisma.pointage.findMany({
      where: { gymId, adherentId },
      orderBy: { horodatage: "desc" },
      take: limite,
      select: { id: true, horodatage: true, statutAdherent: true },
    }),
    prisma.pointage.count({ where: { gymId, adherentId } }),
  ]);

  return { passages, total };
}
