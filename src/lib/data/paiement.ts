// Acces aux donnees des paiements (CLAUDE.md §7 : un fichier par entite).
//
// /!\ Ce fichier n'expose AUCUNE fonction de suppression ni de modification
// d'un paiement, et n'en exposera jamais (§9). Le journal de caisse est en
// ajout seul : on encaisse, ou on ecrit une contrepartie. C'est tout.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { getSuperAdminContext } from "@/lib/super-admin";
import type { MethodePaiement } from "@/generated/prisma/enums";

export const METHODES = ["ESPECES", "WAVE", "ORANGE_MONEY"] as const;

export const schemaPaiement = z.object({
  // Entier strictement positif : un encaissement de 0 FCFA n'existe pas, et
  // un montant negatif ne peut venir que d'une contrepartie, jamais d'un
  // formulaire.
  montant: z.coerce
    .number()
    .int("Le montant doit etre un nombre entier de FCFA")
    .positive("Le montant doit etre superieur a zero")
    .max(50_000_000, "Montant improbable, verifiez la saisie"),
  methode: z.enum(METHODES),
  encaisseLe: z.coerce.date(),
  abonnementId: z.string().optional(),
  reference: z.string().trim().max(60).optional(),
  note: z.string().trim().max(500).optional(),
});

export type DonneesPaiement = z.infer<typeof schemaPaiement>;

/**
 * Enregistre un encaissement.
 *
 * Le montant n'est PAS deduit de l'abonnement : le gerant saisit ce qu'il a
 * reellement recu. Un paiement partiel (10 000 sur 15 000) est un cas normal
 * au Senegal, pas une erreur a corriger.
 */
export async function enregistrerPaiement(
  adherentId: string,
  donnees: DonneesPaiement,
) {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    // L'adherent appartient-il a CETTE salle ? Aucune confiance a l'id recu,
    // meme s'il vient de notre propre page.
    const adherent = await tx.adherent.findFirst({
      where: { id: adherentId, gymId },
      select: { id: true },
    });
    if (!adherent) throw new Error("Adherent introuvable");

    // Si un abonnement est vise, il doit appartenir a la meme salle ET au
    // meme adherent : sans cette seconde verification, on pourrait imputer un
    // paiement sur l'abonnement d'un autre adherent de la salle.
    if (donnees.abonnementId) {
      const abonnement = await tx.abonnement.findFirst({
        where: { id: donnees.abonnementId, gymId, adherentId },
        select: { id: true },
      });
      if (!abonnement) throw new Error("Abonnement introuvable");
    }

    return tx.paiement.create({
      data: {
        gymId,
        adherentId,
        abonnementId: donnees.abonnementId ?? null,
        montant: donnees.montant,
        methode: donnees.methode,
        type: "ENCAISSEMENT",
        reference: donnees.reference || null,
        note: donnees.note || null,
        encaisseLe: donnees.encaisseLe,
      },
    });
  });
}

/**
 * Annule un encaissement — par ECRITURE DE CONTREPARTIE (§9).
 *
 * La ligne d'origine n'est pas touchee. On en ajoute une seconde, de montant
 * exactement oppose, qui la reference. Le total encaisse redevient juste sans
 * qu'aucune agregation ait a connaitre la notion d'annulation.
 *
 * La contrainte @unique sur annuleId empeche une double annulation au niveau
 * de la base, pas seulement ici.
 */
export async function annulerPaiement(id: string, motif: string) {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    const origine = await tx.paiement.findFirst({
      where: { id, gymId },
      include: { contrepartie: { select: { id: true } } },
    });

    if (!origine) throw new Error("Paiement introuvable");
    if (origine.type === "ANNULATION") {
      throw new Error("Une ecriture d'annulation ne s'annule pas");
    }
    if (origine.contrepartie) throw new Error("Ce paiement est deja annule");

    return tx.paiement.create({
      data: {
        gymId,
        adherentId: origine.adherentId,
        abonnementId: origine.abonnementId,
        montant: -origine.montant, // la contrepartie
        methode: origine.methode, // meme canal que l'encaissement d'origine
        type: "ANNULATION",
        annuleId: origine.id,
        motif,
        encaisseLe: new Date(),
      },
    });
  });
}

/* --- Lectures ------------------------------------------------------------- */

/** Journal complet d'un adherent, du plus recent au plus ancien. */
export async function paiementsAdherent(adherentId: string) {
  const { gymId } = await getTenantContext();

  return prisma.paiement.findMany({
    where: { gymId, adherentId },
    orderBy: { encaisseLe: "desc" },
    include: {
      contrepartie: { select: { id: true, motif: true, encaisseLe: true } },
      annule: { select: { id: true, encaisseLe: true, montant: true } },
    },
  });
}

/**
 * Solde d'un abonnement : ce qui reste a encaisser.
 *
 * SUM(montant) et rien d'autre : les contreparties negatives se neutralisent
 * toutes seules. C'est tout l'interet du journal en ajout seul.
 */
export async function soldeAbonnement(abonnementId: string) {
  const { gymId } = await getTenantContext();

  const abonnement = await prisma.abonnement.findFirst({
    where: { id: abonnementId, gymId },
    select: { prixPaye: true },
  });
  if (!abonnement) return null;

  const { _sum } = await prisma.paiement.aggregate({
    where: { gymId, abonnementId },
    _sum: { montant: true },
  });

  const encaisse = _sum.montant ?? 0;
  return {
    du: abonnement.prixPaye,
    encaisse,
    reste: abonnement.prixPaye - encaisse,
  };
}

/* --- Liste globale (page /paiements) -------------------------------------- */

export const PAR_PAGE = 25;

export const PERIODES = ["tout", "jour", "semaine", "mois"] as const;
export type Periode = (typeof PERIODES)[number];

/** Debut de la periode demandee, en heure de Dakar (UTC+0 toute l'annee). */
function debutPeriode(periode: Periode): Date | null {
  const maintenant = new Date();
  const jour = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate(),
    ),
  );

  switch (periode) {
    case "jour":
      return jour;
    case "semaine": {
      // Semaine commencant le lundi : dimanche (0) recule de 6 jours.
      const decalage = (jour.getUTCDay() + 6) % 7;
      const lundi = new Date(jour);
      lundi.setUTCDate(lundi.getUTCDate() - decalage);
      return lundi;
    }
    case "mois":
      return new Date(
        Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1),
      );
    default:
      return null;
  }
}

export type FiltresPaiements = {
  page?: number;
  recherche?: string;
  methode?: MethodePaiement;
  periode?: Periode;
};

export async function listerPaiements({
  page = 1,
  recherche,
  methode,
  periode = "tout",
}: FiltresPaiements = {}) {
  const { gymId } = await getTenantContext();

  const termes = recherche?.trim();
  const depuis = debutPeriode(periode);

  const where = {
    gymId,
    ...(methode ? { methode } : {}),
    ...(depuis ? { encaisseLe: { gte: depuis } } : {}),
    ...(termes
      ? {
          OR: [
            { reference: { contains: termes, mode: "insensitive" as const } },
            {
              adherent: {
                prenom: { contains: termes, mode: "insensitive" as const },
              },
            },
            {
              adherent: {
                nom: { contains: termes, mode: "insensitive" as const },
              },
            },
            {
              adherent: {
                numero: { contains: termes, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [paiements, total, somme] = await Promise.all([
    prisma.paiement.findMany({
      where,
      orderBy: { encaisseLe: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
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
        abonnement: { select: { id: true, nomFormule: true } },
        contrepartie: { select: { id: true, motif: true } },
        annule: { select: { id: true } },
      },
    }),
    prisma.paiement.count({ where }),
    // Le total porte sur TOUTE la selection, pas sur la page affichee : le
    // gerant veut la recette de sa journee, pas celle de 25 lignes.
    prisma.paiement.aggregate({ where, _sum: { montant: true } }),
  ]);

  return {
    paiements,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
    montantTotal: somme._sum.montant ?? 0,
  };
}

/** Recettes du jour, de la semaine et du mois, et repartition par methode. */
export async function statistiquesPaiements() {
  const { gymId } = await getTenantContext();

  const jour = debutPeriode("jour")!;
  const semaine = debutPeriode("semaine")!;
  const mois = debutPeriode("mois")!;

  const [recetteJour, recetteSemaine, recetteMois, parMethode] =
    await Promise.all([
      prisma.paiement.aggregate({
        where: { gymId, encaisseLe: { gte: jour } },
        _sum: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: { gymId, encaisseLe: { gte: semaine } },
        _sum: { montant: true },
      }),
      prisma.paiement.aggregate({
        where: { gymId, encaisseLe: { gte: mois } },
        _sum: { montant: true },
      }),
      prisma.paiement.groupBy({
        by: ["methode"],
        where: { gymId, encaisseLe: { gte: mois } },
        _sum: { montant: true },
      }),
    ]);

  return {
    jour: recetteJour._sum.montant ?? 0,
    semaine: recetteSemaine._sum.montant ?? 0,
    mois: recetteMois._sum.montant ?? 0,
    parMethode: Object.fromEntries(
      parMethode.map((l) => [l.methode, l._sum.montant ?? 0]),
    ) as Partial<Record<MethodePaiement, number>>,
  };
}

/* =============================================================================
   SUPER ADMIN — vue AFRICATECHNOLOGIE, agregat toutes salles confondues.

   Meme exception assumee que dans gym.ts : aucun gymId dans le where, parce
   qu'ici lire TOUTES les salles a la fois est precisement le but (§3).
   ============================================================================= */

function debutDuMoisUTC(decalageMois = 0) {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalageMois, 1));
}

/** "2026-08" -> le 1er aout 2026 UTC. Retombe sur le mois en cours si le
 *  format est absent ou invalide — jamais transmis tel quel a Prisma. */
function debutMoisCible(moisCible?: string): Date {
  if (moisCible && /^\d{4}-\d{2}$/.test(moisCible)) {
    const [annee, mois] = moisCible.split("-").map(Number);
    // mois-1 : l'utilisateur compte de 1 a 12, Date.UTC de 0 a 11.
    return new Date(Date.UTC(annee, mois - 1, 1));
  }
  return debutDuMoisUTC(0);
}

/** "2026-08" pour le mois en cours, servant de valeur par defaut au filtre. */
export function moisCourantISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Encaissements nets (ENCAISSEMENT + ANNULATION, qui se neutralisent d'eux-
 * memes — meme convention que rapport.ts) du mois demande, toutes salles
 * confondues, avec la repartition par salle et la comparaison au mois
 * precedent celui-la (pas au mois en cours : comparer un mois choisi a
 * "maintenant" n'aurait aucun sens).
 */
export async function financeGlobale(moisCible?: string) {
  await getSuperAdminContext();

  const debut = debutMoisCible(moisCible);
  const debutSuivant = debutDuMoisUTC(0);
  debutSuivant.setUTCFullYear(debut.getUTCFullYear());
  debutSuivant.setUTCMonth(debut.getUTCMonth() + 1);
  const debutPrecedent = new Date(debut);
  debutPrecedent.setUTCMonth(debut.getUTCMonth() - 1);

  const [parSalleBrut, precedent] = await Promise.all([
    prisma.paiement.groupBy({
      by: ["gymId"],
      where: { encaisseLe: { gte: debut, lt: debutSuivant } },
      _sum: { montant: true },
    }),
    prisma.paiement.aggregate({
      where: { encaisseLe: { gte: debutPrecedent, lt: debut } },
      _sum: { montant: true },
    }),
  ]);

  const gyms = await prisma.gym.findMany({
    where: { id: { in: parSalleBrut.map((l) => l.gymId) } },
    select: { id: true, nom: true },
  });
  const nomParId = new Map(gyms.map((g) => [g.id, g.nom]));

  const parSalle = parSalleBrut
    .map((l) => ({
      gymId: l.gymId,
      nom: nomParId.get(l.gymId) ?? "Salle inconnue",
      montant: l._sum.montant ?? 0,
    }))
    .sort((a, b) => b.montant - a.montant);

  return {
    mois: `${debut.getUTCFullYear()}-${String(debut.getUTCMonth() + 1).padStart(2, "0")}`,
    total: parSalle.reduce((somme, l) => somme + l.montant, 0),
    totalMoisPrecedent: precedent._sum.montant ?? 0,
    parSalle,
  };
}
