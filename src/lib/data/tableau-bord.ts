// Agregations du tableau de bord.
import "server-only";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const JOUR = 86_400_000;

function debutDuMois(decalageMois = 0) {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalageMois, 1),
  );
}

export async function statistiquesTableauDeBord() {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();
  const dans7Jours = new Date(maintenant.getTime() + 7 * JOUR);
  const moisEnCours = debutDuMois();
  const moisPrecedent = debutDuMois(-1);

  const [
    adherentsActifs,
    adherentsTotal,
    expirations7j,
    souscritMois,
    souscritMoisPrecedent,
    nouveauxMois,
    nouveauxMoisPrecedent,
  ] = await Promise.all([
    prisma.adherent.count({ where: { gymId, statut: "ACTIF" } }),
    prisma.adherent.count({
      where: { gymId, statut: { notIn: ["ARCHIVE"] } },
    }),
    // L'index (gymId, finLe) du §10 sert exactement cette requete.
    prisma.abonnement.count({
      where: {
        gymId,
        statut: "ACTIF",
        finLe: { gte: maintenant, lte: dans7Jours },
      },
    }),
    prisma.abonnement.aggregate({
      where: {
        gymId,
        statut: { not: "ANNULE" },
        debutLe: { gte: moisEnCours },
      },
      _sum: { prixPaye: true },
    }),
    prisma.abonnement.aggregate({
      where: {
        gymId,
        statut: { not: "ANNULE" },
        debutLe: { gte: moisPrecedent, lt: moisEnCours },
      },
      _sum: { prixPaye: true },
    }),
    prisma.adherent.count({ where: { gymId, creeLe: { gte: moisEnCours } } }),
    prisma.adherent.count({
      where: { gymId, creeLe: { gte: moisPrecedent, lt: moisEnCours } },
    }),
  ]);

  const ca = souscritMois._sum.prixPaye ?? 0;
  const caPrecedent = souscritMoisPrecedent._sum.prixPaye ?? 0;

  return {
    adherentsActifs,
    adherentsTotal,
    expirations7j,
    souscritMois: ca,
    variationCA: variation(ca, caPrecedent),
    nouveauxMois,
    variationNouveaux: variation(nouveauxMois, nouveauxMoisPrecedent),
  };
}

/** Variation en % par rapport au mois precedent, ou null si pas de reference. */
function variation(actuel: number, precedent: number): number | null {
  if (precedent === 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 100);
}

/**
 * Chiffre souscrit sur les 6 derniers mois.
 *
 * Requete SQL brute : Prisma ne sait pas grouper par mois calendaire.
 * /!\ Une requete brute contourne toutes les protections de l'ORM. Le gymId
 * DOIT y figurer explicitement — c'est le seul endroit du projet ou l'oubli
 * ne serait signale par rien.
 * Le ${gymId} d'un template tag Prisma est un parametre lie, pas une
 * concatenation de chaine : aucune injection SQL possible.
 */
export async function evolutionSouscriptions() {
  const { gymId } = await getTenantContext();
  const depuis = debutDuMois(-5);

  const lignes = await prisma.$queryRaw<{ mois: Date; total: bigint }[]>`
    SELECT date_trunc('month', "debutLe") AS mois,
           SUM("prixPaye")::bigint        AS total
    FROM "abonnements"
    WHERE "gymId" = ${gymId}
      AND "statut"::text <> 'ANNULE'
      AND "debutLe" >= ${depuis}
    GROUP BY 1
    ORDER BY 1
  `;

  const parMois = new Map(
    lignes.map((l) => [l.mois.toISOString().slice(0, 7), Number(l.total)]),
  );

  // On reconstruit les 6 mois, y compris ceux sans aucune vente : un trou
  // dans un graphe se lit comme une donnee manquante, pas comme un zero.
  const resultat: { mois: string; libelle: string; montant: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = debutDuMois(-i);
    const cle = d.toISOString().slice(0, 7);
    resultat.push({
      mois: cle,
      libelle: new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        timeZone: "UTC",
      }).format(d),
      montant: parMois.get(cle) ?? 0,
    });
  }
  return resultat;
}

/** Repartition des abonnements en cours, par formule. */
export async function repartitionFormules() {
  const { gymId } = await getTenantContext();

  const lignes = await prisma.abonnement.groupBy({
    by: ["nomFormule"],
    where: { gymId, statut: "ACTIF", finLe: { gte: new Date() } },
    _count: { _all: true },
    orderBy: { _count: { nomFormule: "desc" } },
  });

  const total = lignes.reduce((s, l) => s + l._count._all, 0);

  return {
    total,
    lignes: lignes.map((l) => ({
      nom: l.nomFormule,
      nombre: l._count._all,
      pourcentage: total === 0 ? 0 : Math.round((l._count._all / total) * 100),
    })),
  };
}

/** Abonnements arrivant a echeance, du plus urgent au moins urgent. */
export async function abonnementsExpirantBientot(jours = 30, limite = 8) {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();

  return prisma.abonnement.findMany({
    where: {
      gymId,
      statut: "ACTIF",
      finLe: { gte: maintenant, lte: new Date(maintenant.getTime() + jours * JOUR) },
    },
    orderBy: { finLe: "asc" },
    take: limite,
    include: {
      adherent: {
        select: { id: true, prenom: true, nom: true, numero: true, photoUrl: true },
      },
    },
  });
}

/**
 * Frequentation des 7 derniers jours, et heure de pointe.
 *
 * Requete SQL brute : Prisma ne sait pas grouper par jour ni par heure.
 * /!\ Meme avertissement que ci-dessus — une requete brute contourne toutes
 * les protections de l'ORM. Le gymId DOIT y figurer explicitement. Le
 * ${gymId} d'un template tag Prisma est un parametre lie, pas une
 * concatenation : aucune injection possible.
 *
 * Les dates sont tronquees en UTC, ce qui correspond a l'heure de Dakar
 * (UTC+0 toute l'annee) : une journee de pointage va bien de minuit a minuit,
 * heure locale.
 */
export async function frequentationHebdomadaire() {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();
  const depuis = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate() - 6,
    ),
  );

  const [parJour, parHeure] = await Promise.all([
    prisma.$queryRaw<{ jour: Date; total: bigint }[]>`
      SELECT date_trunc('day', "horodatage") AS jour,
             COUNT(*)::bigint                AS total
      FROM "pointages"
      WHERE "gymId" = ${gymId}
        AND "horodatage" >= ${depuis}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<{ heure: number; total: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "horodatage")::int AS heure,
             COUNT(*)::bigint                     AS total
      FROM "pointages"
      WHERE "gymId" = ${gymId}
        AND "horodatage" >= ${depuis}
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 1
    `,
  ]);

  const parCle = new Map(
    parJour.map((l) => [l.jour.toISOString().slice(0, 10), Number(l.total)]),
  );

  // On reconstruit les 7 jours, y compris ceux sans aucun passage : un trou
  // dans un graphe se lit comme une donnee manquante, pas comme un zero.
  const jours: { libelle: string; passages: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      Date.UTC(
        maintenant.getUTCFullYear(),
        maintenant.getUTCMonth(),
        maintenant.getUTCDate() - i,
      ),
    );
    jours.push({
      libelle: new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        timeZone: "UTC",
      }).format(d),
      passages: parCle.get(d.toISOString().slice(0, 10)) ?? 0,
    });
  }

  const total = jours.reduce((s, j) => s + j.passages, 0);
  const pointe = parHeure[0]
    ? `${String(parHeure[0].heure).padStart(2, "0")}h`
    : null;

  return { jours, total, pointe };
}
