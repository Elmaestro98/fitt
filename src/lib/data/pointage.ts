// Acces aux donnees du pointage (CLAUDE.md §7 : un fichier par entite).
//
// /!\ CE FICHIER N'ECRIT QUE DANS `pointages`. Jamais dans `abonnements`,
// jamais dans `paiements`, jamais dans `adherents.statut` (CLAUDE.md §9).
// L'adherent paie un droit d'acces, pas une consommation : son absence ne
// raccourcit pas son contrat. La fleche ne va que dans un sens — on LIT
// l'abonnement pour afficher les jours restants a la borne, on ne le touche
// jamais. Une demande du type "suspendre ceux qui ne viennent plus" se
// traite par une ALERTE (lib/data/decrochage.ts), pas par une ecriture ici.
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
import { critereRechercheAdherent } from "@/lib/data/adherent";

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

/* --- Registre de presence -------------------------------------------------- */

/*
 * Le registre repond a la question que rien ne savait traiter jusqu'ici :
 * "qui est venu le 3 septembre ?". La borne affiche les douze derniers
 * passages, la fiche d'un adherent les vingt siens — le journal complet de la
 * salle n'existait nulle part.
 *
 * /!\ LECTURE SEULE, et c'est structurel : consulter les presences ne doit
 * jamais devenir un moyen d'agir sur un contrat (regle rappelee en tete de ce
 * fichier). Tout ce qui suit interroge, rien n'ecrit.
 */

export const PAR_PAGE_REGISTRE = 25;

/* Liste blanche des sources acceptees depuis une URL. Elle double l'enum
   Prisma a dessein : une valeur inventee dans la barre d'adresse doit etre
   ecartee AVANT d'atteindre la base, pas provoquer une erreur du moteur. */
export const SOURCES = ["KIOSQUE", "STAFF", "ADHERENT"] as const;
export type SourceRegistre = (typeof SOURCES)[number];

/* Plafond de l'export CSV. Trois ans d'une salle de 400 adherents tiennent
   largement dessous ; la borne existe pour qu'aucune requete ne puisse
   immobiliser le serveur d'une salle qui en a besoin au meme moment. */
const MAX_EXPORT = 5000;

export type FiltresRegistre = {
  page?: number;
  recherche?: string;
  /** Premier jour COMPRIS, au format "2026-09-03". */
  du?: string;
  /** Dernier jour COMPRIS, meme format. */
  au?: string;
  source?: SourceRegistre;
};

/**
 * "2026-09-03" -> minuit UTC de ce jour, ou null si la chaine ne tient pas.
 *
 * /!\ La verification du mois n'est pas superflue : Date.UTC(2026, 1, 31) ne
 * jette pas, il DEBORDE silencieusement sur le 3 mars. Sans ce controle, une
 * date impossible tapee dans l'URL donnerait une periode plausible mais
 * fausse, et le gerant lirait un registre decale sans jamais s'en douter.
 */
function jourUTC(iso?: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;

  const [annee, mois, jour] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));

  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) return null;

  return date;
}

/**
 * Le `where` du registre. Ecrit une seule fois, consomme par la liste
 * paginee, les compteurs ET l'export : trois vues d'une meme selection qui ne
 * peuvent pas diverger, puisqu'elles partagent le critere.
 */
function whereRegistre(gymId: string, filtres: FiltresRegistre) {
  const du = jourUTC(filtres.du);
  const au = jourUTC(filtres.au);

  // `au` designe un jour COMPRIS dans la selection : la borne envoyee a
  // Prisma est donc minuit du LENDEMAIN, en `lt`. Avec un `lte` pose sur
  // minuit, toute la derniere journee disparaitrait du registre — meme
  // precaution que la borne exclusive de lib/utils/periode.ts.
  const finExclusive = au ? new Date(au.getTime() + 86_400_000) : null;

  return {
    gymId,
    ...(filtres.source ? { source: filtres.source } : {}),
    ...(du || finExclusive
      ? {
          horodatage: {
            ...(du ? { gte: du } : {}),
            ...(finExclusive ? { lt: finExclusive } : {}),
          },
        }
      : {}),
    // Le critere de recherche est IMPORTE de lib/data/adherent.ts, jamais
    // recopie : c'est la que se logeait le piege du `contains: ""` (§6), et
    // le registre cherche exactement les memes adherents que la liste.
    ...(filtres.recherche?.trim()
      ? { adherent: critereRechercheAdherent(filtres.recherche) }
      : {}),
  };
}

/**
 * Le journal des passages de la salle, filtre et pagine cote serveur.
 *
 * Renvoie aussi les compteurs de LA SELECTION, pas de la journee en cours :
 * le gerant qui filtre sur une semaine veut le total de cette semaine.
 */
export async function listerPointages(filtres: FiltresRegistre = {}) {
  const { gymId } = await getTenantContext();

  const page = Math.max(1, filtres.page ?? 1);
  const where = whereRegistre(gymId, filtres);

  const [passages, total, adherentsVenus, aRegulariser] = await Promise.all([
    prisma.pointage.findMany({
      where,
      orderBy: { horodatage: "desc" },
      skip: (page - 1) * PAR_PAGE_REGISTRE,
      take: PAR_PAGE_REGISTRE,
      select: {
        id: true,
        horodatage: true,
        source: true,
        statutAdherent: true,
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
    }),
    prisma.pointage.count({ where }),
    // groupBy plutot que findMany({ distinct }) : le DISTINCT est alors fait
    // par PostgreSQL, qui ne renvoie qu'une ligne par adherent. Le `distinct`
    // de Prisma, lui, rapatrie d'abord TOUS les passages pour les dedupliquer
    // en memoire — sur "toute la periode", c'est la difference entre trois
    // cents lignes et plusieurs dizaines de milliers.
    prisma.pointage
      .groupBy({ by: ["adherentId"], where })
      .then((lignes) => lignes.length),
    // Passages enregistres alors que l'abonnement ne couvrait plus rien. Ce
    // n'est PAS un refus d'entree (§9) : c'est la liste de ce que la
    // reception a a regulariser.
    prisma.pointage.count({
      where: { ...where, statutAdherent: { in: ["EXPIRE", "SUSPENDU"] } },
    }),
  ]);

  return {
    passages,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAR_PAGE_REGISTRE)),
    adherentsVenus,
    aRegulariser,
  };
}

export type LignePointage = Awaited<
  ReturnType<typeof listerPointages>
>["passages"][number];

/**
 * Les memes passages, sans pagination, pour le telechargement CSV.
 *
 * Le telephone y figure alors qu'il est absent du tableau a l'ecran : un
 * fichier exporte sert justement a rappeler les absents ou a croiser avec un
 * autre outil, et il ne quitte pas le poste du gerant.
 */
export async function lignesExportRegistre(filtres: FiltresRegistre = {}) {
  const { gymId } = await getTenantContext();

  return prisma.pointage.findMany({
    where: whereRegistre(gymId, filtres),
    orderBy: { horodatage: "desc" },
    take: MAX_EXPORT,
    select: {
      horodatage: true,
      source: true,
      statutAdherent: true,
      adherent: {
        select: { prenom: true, nom: true, numero: true, telephone: true },
      },
    },
  });
}
