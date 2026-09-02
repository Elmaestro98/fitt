// Agregations du tableau de bord.
//
// Deux natures de chiffres cohabitent ici, et la distinction commande tout :
//
//   - Les PHOTOS DE L'INSTANT (adherents actifs, echeances a venir,
//     repartition des formules) decrivent un etat vrai maintenant. Elles ne
//     prennent PAS de periode : "142 adherents actifs au mois de juin" ne
//     veut rien dire, un adherent est actif aujourd'hui ou il ne l'est pas.
//     Leur donner une periode produirait un chiffre faux affiche avec
//     l'aplomb d'un chiffre vrai.
//
//   - Les FLUX (souscriptions, nouveaux adherents, frequentation) comptent ce
//     qui s'est passe entre deux dates. Eux seuls recoivent la periode.
import "server-only";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { colonnesDe, type Periode } from "@/lib/utils/periode";

const JOUR = 86_400_000;

/**
 * Les quatre indicateurs de tete.
 *
 * Les deux premiers ignorent la periode (voir l'en-tete du fichier), les deux
 * suivants la suivent et se comparent a la periode de meme ampleur qui
 * precede — jamais a un "mois dernier" fige, qui n'aurait aucun sens face a
 * une plage libre de neuf jours.
 */
export async function statistiquesTableauDeBord(periode: Periode) {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();
  const dans7Jours = new Date(maintenant.getTime() + 7 * JOUR);

  const [
    adherentsActifs,
    adherentsTotal,
    expirations7j,
    souscritPeriode,
    souscritPrecedent,
    nouveauxPeriode,
    nouveauxPrecedent,
  ] = await Promise.all([
    // --- Photos de l'instant : aucune borne de date ------------------------
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

    // --- Flux : bornes fournies par la periode -----------------------------
    // `lt: fin` et non `lte` : la borne de fin est exclusive (voir
    // lib/utils/periode.ts), ce qui fait entrer le dernier jour en entier.
    prisma.abonnement.aggregate({
      where: {
        gymId,
        statut: { not: "ANNULE" },
        debutLe: { gte: periode.debut, lt: periode.fin },
      },
      _sum: { prixPaye: true },
    }),
    prisma.abonnement.aggregate({
      where: {
        gymId,
        statut: { not: "ANNULE" },
        debutLe: { gte: periode.debutPrecedent, lt: periode.finPrecedent },
      },
      _sum: { prixPaye: true },
    }),
    prisma.adherent.count({
      where: { gymId, creeLe: { gte: periode.debut, lt: periode.fin } },
    }),
    prisma.adherent.count({
      where: {
        gymId,
        creeLe: { gte: periode.debutPrecedent, lt: periode.finPrecedent },
      },
    }),
  ]);

  const ca = souscritPeriode._sum.prixPaye ?? 0;
  const caPrecedent = souscritPrecedent._sum.prixPaye ?? 0;

  return {
    adherentsActifs,
    adherentsTotal,
    expirations7j,
    souscritPeriode: ca,
    variationCA: variation(ca, caPrecedent),
    nouveauxPeriode,
    variationNouveaux: variation(nouveauxPeriode, nouveauxPrecedent),
  };
}

/** Variation en %, ou null quand la periode precedente est vide : diviser par
 *  zero donnerait un "+Infini %" que personne ne peut interpreter. */
function variation(actuel: number, precedent: number): number | null {
  if (precedent === 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 100);
}

/**
 * Chiffre souscrit sur la periode, decoupe en jours ou en mois selon son
 * ampleur (lib/utils/periode.ts decide).
 *
 * Requete SQL brute : Prisma ne sait grouper ni par jour ni par mois
 * calendaire.
 * /!\ Une requete brute contourne toutes les protections de l'ORM. Le gymId
 * DOIT y figurer explicitement — c'est l'un des rares endroits du projet ou
 * l'oubli ne serait signale par rien.
 * Les ${...} d'un template tag Prisma sont des parametres lies, pas une
 * concatenation de chaines : aucune injection SQL possible, y compris pour
 * l'unite passee a date_trunc.
 */
export async function evolutionSouscriptions(periode: Periode) {
  const { gymId } = await getTenantContext();
  const unite = periode.granularite === "mois" ? "month" : "day";

  const lignes = await prisma.$queryRaw<{ tranche: Date; total: bigint }[]>`
    SELECT date_trunc(${unite}, "debutLe") AS tranche,
           SUM("prixPaye")::bigint         AS total
    FROM "abonnements"
    WHERE "gymId" = ${gymId}
      AND "statut"::text <> 'ANNULE'
      AND "debutLe" >= ${periode.debut}
      AND "debutLe" <  ${periode.fin}
    GROUP BY 1
    ORDER BY 1
  `;

  const longueurCle = periode.granularite === "mois" ? 7 : 10;
  const parTranche = new Map(
    lignes.map((l) => [
      l.tranche.toISOString().slice(0, longueurCle),
      Number(l.total),
    ]),
  );

  // colonnesDe() reconstruit les tranches vides : un trou dans un graphe se
  // lit comme une donnee manquante, pas comme un zero.
  return colonnesDe(periode).map((colonne) => ({
    mois: colonne.cle,
    libelle: colonne.libelle,
    montant: parTranche.get(colonne.cle) ?? 0,
  }));
}

/**
 * Repartition des abonnements EN COURS, par formule.
 *
 * Photo de l'instant : pas de periode. La question posee est "de quoi est
 * fait mon parc aujourd'hui", pas "qu'ai-je vendu en juin".
 */
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

/**
 * Abonnements arrivant a echeance, du plus urgent au moins urgent.
 *
 * Photo de l'instant, tournee vers l'AVENIR : ces echeances sont a relancer
 * cette semaine, quelle que soit la periode que le gerant observe par
 * ailleurs. Les faire suivre le filtre ferait disparaitre ses relances du
 * jour des qu'il consulterait le mois dernier.
 */
export async function abonnementsExpirantBientot(jours = 30, limite = 8) {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();

  return prisma.abonnement.findMany({
    where: {
      gymId,
      statut: "ACTIF",
      finLe: {
        gte: maintenant,
        lte: new Date(maintenant.getTime() + jours * JOUR),
      },
    },
    orderBy: { finLe: "asc" },
    take: limite,
    include: {
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

/**
 * Frequentation sur la periode, et heure de pointe.
 *
 * Requete brute, meme avertissement que ci-dessus : le gymId DOIT y figurer
 * explicitement, et les ${...} sont des parametres lies.
 *
 * Les dates sont tronquees en UTC, ce qui correspond a l'heure de Dakar
 * (UTC+0 toute l'annee) : une journee de pointage va bien de minuit a minuit,
 * heure locale.
 */
export async function frequentationPeriode(periode: Periode) {
  const { gymId } = await getTenantContext();
  const unite = periode.granularite === "mois" ? "month" : "day";

  const [parTranche, parHeure] = await Promise.all([
    prisma.$queryRaw<{ tranche: Date; total: bigint }[]>`
      SELECT date_trunc(${unite}, "horodatage") AS tranche,
             COUNT(*)::bigint                   AS total
      FROM "pointages"
      WHERE "gymId" = ${gymId}
        AND "horodatage" >= ${periode.debut}
        AND "horodatage" <  ${periode.fin}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<{ heure: number; total: bigint }[]>`
      SELECT EXTRACT(HOUR FROM "horodatage")::int AS heure,
             COUNT(*)::bigint                     AS total
      FROM "pointages"
      WHERE "gymId" = ${gymId}
        AND "horodatage" >= ${periode.debut}
        AND "horodatage" <  ${periode.fin}
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 1
    `,
  ]);

  const longueurCle = periode.granularite === "mois" ? 7 : 10;
  const parCle = new Map(
    parTranche.map((l) => [
      l.tranche.toISOString().slice(0, longueurCle),
      Number(l.total),
    ]),
  );

  const tranches = colonnesDe(periode).map((colonne) => ({
    libelle: colonne.libelle,
    passages: parCle.get(colonne.cle) ?? 0,
  }));

  const total = tranches.reduce((s, t) => s + t.passages, 0);
  const pointe = parHeure[0]
    ? `${String(parHeure[0].heure).padStart(2, "0")}h`
    : null;

  return {
    jours: tranches,
    total,
    pointe,
    /** Moyenne quotidienne : le seul chiffre comparable d'une periode a
     *  l'autre quand elles n'ont pas la meme longueur. */
    moyenneParJour: Math.round(total / periode.jours),
  };
}
