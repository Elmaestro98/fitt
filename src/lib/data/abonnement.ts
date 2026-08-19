// Acces aux donnees des abonnements.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { ajouterDuree, type UniteDuree } from "@/lib/utils/duree";

export const schemaSouscription = z.object({
  formuleId: z.string().min(1, "Choisissez une formule"),
  debutLe: z.coerce.date(),
});

export type DonneesSouscription = z.infer<typeof schemaSouscription>;

/**
 * Souscrit un abonnement pour un adherent.
 *
 * C'est ICI que la photographie est prise (CLAUDE.md §9) : nomFormule,
 * prixPaye et finLe sont copies au moment de la vente et ne bougeront plus,
 * quoi qu'il arrive ensuite a la formule.
 */
export async function souscrireAbonnement(
  adherentId: string,
  donnees: DonneesSouscription,
) {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    // 1. L'adherent appartient-il bien a CETTE salle ? On ne fait aucune
    //    confiance a l'id recu, meme s'il vient de notre propre page.
    const adherent = await tx.adherent.findFirst({
      where: { id: adherentId, gymId },
      select: { id: true },
    });
    if (!adherent) throw new Error("Adherent introuvable");

    // 2. La formule aussi. Et elle doit etre active : on ne vend pas une
    //    offre archivee.
    const formule = await tx.formule.findFirst({
      where: { id: donnees.formuleId, gymId, actif: true },
    });
    if (!formule) throw new Error("Formule introuvable ou archivee");

    // 3. Le calcul de la date de fin. UNE SEULE FOIS, maintenant.
    const finLe = ajouterDuree(
      donnees.debutLe,
      formule.dureeValeur,
      formule.dureeUnite as UniteDuree,
    );

    // 4. La photographie.
    const abonnement = await tx.abonnement.create({
      data: {
        gymId,
        adherentId,
        formuleId: formule.id,
        nomFormule: formule.nom, // copie
        prixPaye: formule.prix, // copie
        debutLe: donnees.debutLe,
        finLe, // calculee, jamais recalculee
      },
    });

    // 5. L'adherent redevient ACTIF. C'est la contrepartie de la
    //    denormalisation assumee dans le schema : toute ecriture sur
    //    Abonnement doit resynchroniser Adherent.statut.
    //    On ne touche pas a un adherent SUSPENDU ou ARCHIVE : ces statuts
    //    sont des decisions du staff, pas des consequences d'un paiement.
    await tx.adherent.updateMany({
      where: { id: adherentId, gymId, statut: { in: ["ACTIF", "EXPIRE"] } },
      data: { statut: "ACTIF" },
    });

    return abonnement;
  });
}

/** L'abonnement en cours d'un adherent, ou null. */
export async function abonnementActuel(adherentId: string) {
  const { gymId } = await getTenantContext();

  return prisma.abonnement.findFirst({
    where: {
      gymId,
      adherentId,
      statut: "ACTIF",
      finLe: { gte: new Date() },
    },
    orderBy: { finLe: "desc" },
  });
}

/** Historique complet, du plus recent au plus ancien. */
export async function listerAbonnementsAdherent(adherentId: string) {
  const { gymId } = await getTenantContext();

  return prisma.abonnement.findMany({
    where: { gymId, adherentId },
    orderBy: { debutLe: "desc" },
  });
}

/**
 * Date de debut a proposer par defaut.
 *
 * Si l'adherent a encore un abonnement valide, on enchaine a sa fin plutot
 * que d'ecraser les jours qu'il a payes : renouveler le 20 alors qu'il reste
 * 10 jours ne doit pas les faire perdre.
 */
export async function debutProposePour(adherentId: string) {
  const actuel = await abonnementActuel(adherentId);
  if (!actuel) return new Date();
  return actuel.finLe;
}

/**
 * Annule un abonnement. Jamais de suppression (esprit du §9) : on marque, on
 * date et on exige un motif. L'ecriture reste dans l'historique.
 */
export async function annulerAbonnement(id: string, motif: string) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.abonnement.updateMany({
    where: { id, gymId, statut: "ACTIF" },
    data: { statut: "ANNULE", annuleLe: new Date(), motifAnnul: motif },
  });

  if (resultat.count === 0) {
    throw new Error("Abonnement introuvable ou deja annule");
  }
}

/**
 * Passe en EXPIRE les abonnements echus, puis les adherents qui n'ont plus
 * aucun abonnement valide.
 *
 * C'est le prix de la denormalisation : Adherent.statut est stocke pour etre
 * indexable, il faut donc l'entretenir. Deux UPDATE indexes, negligeables
 * pour une salle de 400 adherents.
 *
 * Lot 2 : deplacer cet appel dans une tache planifiee quotidienne, plutot
 * qu'au chargement des ecrans.
 */
export async function synchroniserExpirations() {
  const { gymId } = await getTenantContext();
  const maintenant = new Date();

  await prisma.abonnement.updateMany({
    where: { gymId, statut: "ACTIF", finLe: { lt: maintenant } },
    data: { statut: "EXPIRE" },
  });

  // Les adherents ACTIF sans aucun abonnement encore valide deviennent EXPIRE.
  // SUSPENDU et ARCHIVE ne sont pas touches : ce sont des decisions du staff.
  const sansCouverture = await prisma.adherent.findMany({
    where: {
      gymId,
      statut: "ACTIF",
      abonnements: {
        none: { statut: "ACTIF", finLe: { gte: maintenant } },
      },
    },
    select: { id: true },
  });

  if (sansCouverture.length > 0) {
    await prisma.adherent.updateMany({
      where: { gymId, id: { in: sansCouverture.map((a) => a.id) } },
      data: { statut: "EXPIRE" },
    });
  }
}

/* --- Liste globale (page /abonnements) ------------------------------------ */

const JOUR = 86_400_000;

/* Pagination cote serveur des la premiere ligne (§7) : une salle de 400
   adherents accumule des milliers d'abonnements en trois ans. */
export const PAR_PAGE = 25;

export const VUES = [
  "tous",
  "en-cours",
  "bientot",
  "expires",
  "annules",
] as const;

export type VueAbonnements = (typeof VUES)[number];

/**
 * Traduit l'onglet choisi en criteres Prisma.
 *
 * Ces criteres viennent s'AJOUTER au gymId, jamais le remplacer : la fonction
 * ne renvoie que la partie metier du where.
 */
function filtreVue(vue: VueAbonnements, maintenant: Date) {
  switch (vue) {
    case "en-cours":
      return { statut: "ACTIF" as const };
    case "bientot":
      // L'index (gymId, finLe) du §10 sert exactement cette requete.
      return {
        statut: "ACTIF" as const,
        finLe: {
          gte: maintenant,
          lte: new Date(maintenant.getTime() + 7 * JOUR),
        },
      };
    case "expires":
      return { statut: "EXPIRE" as const };
    case "annules":
      return { statut: "ANNULE" as const };
    default:
      return {};
  }
}

export type FiltresAbonnements = {
  page?: number;
  recherche?: string;
  vue?: VueAbonnements;
};

export async function listerAbonnements({
  page = 1,
  recherche,
  vue = "tous",
}: FiltresAbonnements = {}) {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();
  const termes = recherche?.trim();

  const where = {
    gymId,
    ...filtreVue(vue, maintenant),
    ...(termes
      ? {
          OR: [
            { nomFormule: { contains: termes, mode: "insensitive" as const } },
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

  // Les vues "vivantes" se lisent par urgence (la prochaine echeance en
  // premier) ; les vues d'archive, par anteriorite.
  const orderBy =
    vue === "en-cours" || vue === "bientot"
      ? ({ finLe: "asc" } as const)
      : ({ debutLe: "desc" } as const);

  const [abonnements, total] = await Promise.all([
    prisma.abonnement.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      include: {
        adherent: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            numero: true,
            telephone: true,
            photoUrl: true,
          },
        },
      },
    }),
    prisma.abonnement.count({ where }),
  ]);

  return {
    abonnements,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
  };
}

/** Compteurs des onglets, et chiffre souscrit encore en cours. */
export async function statistiquesAbonnements() {
  const { gymId } = await getTenantContext();
  const maintenant = new Date();

  const [tous, enCours, bientot, expires, annules, encours] = await Promise.all([
    prisma.abonnement.count({ where: { gymId } }),
    prisma.abonnement.count({ where: { gymId, statut: "ACTIF" } }),
    prisma.abonnement.count({
      where: {
        gymId,
        statut: "ACTIF",
        finLe: { gte: maintenant, lte: new Date(maintenant.getTime() + 7 * JOUR) },
      },
    }),
    prisma.abonnement.count({ where: { gymId, statut: "EXPIRE" } }),
    prisma.abonnement.count({ where: { gymId, statut: "ANNULE" } }),
    prisma.abonnement.aggregate({
      where: { gymId, statut: "ACTIF" },
      _sum: { prixPaye: true },
    }),
  ]);

  return {
    compteurs: { tous, "en-cours": enCours, bientot, expires, annules },
    montantEnCours: encours._sum.prixPaye ?? 0,
  };
}
