// Rapports (Lot 5) : lecture seule, rien ici n'ecrit en base.
//
// Different du tableau de bord : le tableau de bord montre le pouls du jour
// (§ evolutionSouscriptions y agrege ce qui est SOUSCRIT, prixPaye a la
// vente). Ici on agrege ce qui est ENCAISSE (Paiement.montant) — la realite
// de caisse, avec ses paiements partiels et ses annulations. Les deux
// chiffres divergent legitimement, d'ou la mise en garde deja presente sur
// le tableau de bord ("Montants souscrits, pas encaisses").
import "server-only";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const JOUR = 86_400_000;

/* Preselections offertes par le filtre de periode de /rapports. Pas de plage
   libre : sur mobile, quatre boutons se touchent plus vite qu'un calendrier,
   et couvrent l'essentiel des besoins d'un gerant de salle. */
export const PERIODES_RAPPORT = [3, 6, 12, 24] as const;
export type PeriodeRapport = (typeof PERIODES_RAPPORT)[number];

function debutDuMois(decalageMois = 0) {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalageMois, 1),
  );
}

/**
 * Encaissements nets (ENCAISSEMENT + ANNULATION, qui se neutralisent d'eux-
 * memes) sur les N derniers mois, mois calendaires reconstruits meme sans
 * aucune ecriture — un trou dans le graphe se lit comme une donnee
 * manquante, pas comme un zero (meme convention que evolutionSouscriptions).
 */
export async function revenusEncaissesParMois(mois: PeriodeRapport = 12) {
  const { gymId } = await getTenantContext();
  const depuis = debutDuMois(-(mois - 1));

  // Requete brute : Prisma ne sait pas grouper par mois calendaire. Le
  // ${gymId} d'un template tag Prisma est un parametre lie, pas une
  // concatenation de chaine : aucune injection SQL possible (meme
  // avertissement que tableau-bord.ts).
  const lignes = await prisma.$queryRaw<{ mois: Date; total: bigint }[]>`
    SELECT date_trunc('month', "encaisseLe") AS mois,
           SUM("montant")::bigint            AS total
    FROM "paiements"
    WHERE "gymId" = ${gymId}
      AND "encaisseLe" >= ${depuis}
    GROUP BY 1
    ORDER BY 1
  `;

  const parMois = new Map(
    lignes.map((l) => [l.mois.toISOString().slice(0, 7), Number(l.total)]),
  );

  const resultat: { mois: string; libelle: string; montant: number }[] = [];
  for (let i = mois - 1; i >= 0; i--) {
    const d = debutDuMois(-i);
    const cle = d.toISOString().slice(0, 7);
    resultat.push({
      mois: cle,
      libelle: new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        year: mois > 6 ? "2-digit" : undefined,
        timeZone: "UTC",
      }).format(d),
      montant: parMois.get(cle) ?? 0,
    });
  }
  return resultat;
}

/** Repartition des encaissements par methode, sur les N derniers mois. */
export async function repartitionMethodesPaiement(mois: PeriodeRapport = 12) {
  const { gymId } = await getTenantContext();
  const depuis = debutDuMois(-(mois - 1));

  const lignes = await prisma.paiement.groupBy({
    by: ["methode"],
    where: { gymId, encaisseLe: { gte: depuis } },
    _sum: { montant: true },
  });

  const total = lignes.reduce((s, l) => s + (l._sum.montant ?? 0), 0);

  return {
    total,
    lignes: lignes
      .map((l) => ({
        methode: l.methode,
        montant: l._sum.montant ?? 0,
        pourcentage:
          total === 0 ? 0 : Math.round(((l._sum.montant ?? 0) / total) * 100),
      }))
      // Les methodes a zero (aucun encaissement dans la periode) n'ont rien a
      // montrer dans un camembert.
      .filter((l) => l.montant > 0)
      .sort((a, b) => b.montant - a.montant),
  };
}

/**
 * Taux de renouvellement : parmi les abonnements arrives a echeance il y a
 * entre GRACE et (GRACE + fenetreMois) jours, quelle proportion a ete suivie
 * d'un nouvel abonnement du meme adherent dans les GRACE jours ?
 *
 * Le delai de grace de 14 jours ecarte les echeances trop recentes : un
 * abonnement fini avant-hier n'a pas encore eu le temps d'etre renouvele, le
 * compter tout de suite ferait chuter artificiellement le taux.
 */
const GRACE_JOURS = 14;

export async function tauxRenouvellement(fenetreMois = 6) {
  const { gymId } = await getTenantContext();
  const maintenant = new Date();
  const finFenetre = new Date(maintenant.getTime() - GRACE_JOURS * JOUR);
  const debutFenetre = new Date(
    finFenetre.getTime() - fenetreMois * 30 * JOUR,
  );

  const [ligne] = await prisma.$queryRaw<
    { total: bigint; renouveles: bigint }[]
  >`
    WITH echus AS (
      SELECT a.id, a."adherentId", a."finLe"
      FROM "abonnements" a
      WHERE a."gymId" = ${gymId}
        AND a.statut <> 'ANNULE'
        AND a."finLe" >= ${debutFenetre}
        AND a."finLe" < ${finFenetre}
    )
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM "abonnements" b
          WHERE b."gymId" = ${gymId}
            AND b."adherentId" = echus."adherentId"
            AND b.statut <> 'ANNULE'
            AND b."debutLe" > echus."finLe"
            AND b."debutLe" <= echus."finLe" + (${GRACE_JOURS} || ' days')::interval
        )
      )::bigint AS renouveles
    FROM echus
  `;

  const total = Number(ligne?.total ?? 0);
  const renouveles = Number(ligne?.renouveles ?? 0);

  return {
    total,
    renouveles,
    taux: total === 0 ? null : Math.round((renouveles / total) * 100),
  };
}

/** Les adherents les plus assidus sur la periode, par nombre de passages. */
export async function adherentsAssidus(jours = 30, limite = 10) {
  const { gymId } = await getTenantContext();
  const depuis = new Date(Date.now() - jours * JOUR);

  const compteurs = await prisma.pointage.groupBy({
    by: ["adherentId"],
    where: { gymId, horodatage: { gte: depuis } },
    _count: { _all: true },
    orderBy: { _count: { adherentId: "desc" } },
    take: limite,
  });

  if (compteurs.length === 0) return [];

  const adherents = await prisma.adherent.findMany({
    where: { gymId, id: { in: compteurs.map((c) => c.adherentId) } },
    select: { id: true, prenom: true, nom: true, numero: true, photoUrl: true },
  });
  type Adherent = (typeof adherents)[number];
  const parId = new Map(adherents.map((a) => [a.id, a]));

  // groupBy ne garantit pas de renvoyer les adherents dans le meme ordre que
  // leurs entrees en base : on reconstruit le classement depuis compteurs,
  // qui lui est deja trie par nombre de passages.
  const lignes: { adherent: Adherent; passages: number }[] = [];
  for (const c of compteurs) {
    const adherent = parId.get(c.adherentId);
    if (adherent) lignes.push({ adherent, passages: c._count._all });
  }
  return lignes;
}

/**
 * Encaissements par mois ET par methode — le detail que demande la
 * comptabilite, plus fin que le seul total de revenusEncaissesParMois.
 * Sert uniquement a l'export CSV (route /api/rapports/export).
 */
export async function lignesExportRapport(mois: PeriodeRapport = 12) {
  const { gymId } = await getTenantContext();
  const depuis = debutDuMois(-(mois - 1));

  const brut = await prisma.$queryRaw<
    { mois: Date; methode: string; total: bigint }[]
  >`
    SELECT date_trunc('month', "encaisseLe") AS mois,
           "methode"::text                    AS methode,
           SUM("montant")::bigint              AS total
    FROM "paiements"
    WHERE "gymId" = ${gymId}
      AND "encaisseLe" >= ${depuis}
    GROUP BY 1, 2
    ORDER BY 1
  `;

  const parMois = new Map<string, Record<string, number>>();
  for (const ligne of brut) {
    const cle = ligne.mois.toISOString().slice(0, 7);
    const courant = parMois.get(cle) ?? {};
    courant[ligne.methode] = Number(ligne.total);
    parMois.set(cle, courant);
  }

  const resultat: {
    libelle: string;
    especes: number;
    wave: number;
    orangeMoney: number;
    total: number;
  }[] = [];

  for (let i = mois - 1; i >= 0; i--) {
    const d = debutDuMois(-i);
    const parMethode = parMois.get(d.toISOString().slice(0, 7)) ?? {};
    const especes = parMethode.ESPECES ?? 0;
    const wave = parMethode.WAVE ?? 0;
    const orangeMoney = parMethode.ORANGE_MONEY ?? 0;

    resultat.push({
      libelle: new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(d),
      especes,
      wave,
      orangeMoney,
      total: especes + wave + orangeMoney,
    });
  }

  return resultat;
}
