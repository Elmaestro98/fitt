// Acces aux donnees des adherents (CLAUDE.md §7 : un fichier par entite).
//
// REGLE ABSOLUE : chaque fonction commence par getTenantContext() et filtre
// sur le gymId qu'elle en tire. Aucune exception. Le gymId n'est jamais un
// parametre de ces fonctions — sinon un appelant pourrait passer celui d'une
// autre salle, et toute la protection tomberait.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { normaliserTelephone } from "@/lib/utils/telephone";
import { formatNumeroAdherent } from "@/lib/utils/format";
import type { StatutAdherent } from "@/generated/prisma/enums";

/* Pagination cote serveur des la premiere ligne (CLAUDE.md §7) : une salle de
   400 adherents ne doit jamais tout charger d'un coup. */
export const PAR_PAGE = 25;

export type FiltresAdherents = {
  page?: number;
  recherche?: string;
  statut?: StatutAdherent;
};

export async function listerAdherents({
  page = 1,
  recherche,
  statut,
}: FiltresAdherents = {}) {
  const { gymId } = await getTenantContext();

  const termes = recherche?.trim();
  const chiffres = termes?.replace(/\D/g, "");

  // Le gymId est toujours present dans le where. Les autres criteres
  // viennent s'ajouter, jamais le remplacer.
  const where = {
    gymId,
    ...(statut ? { statut } : {}),
    ...(termes
      ? {
          OR: [
            { prenom: { contains: termes, mode: "insensitive" as const } },
            { nom: { contains: termes, mode: "insensitive" as const } },
            { numero: { contains: termes, mode: "insensitive" as const } },
            // "contains: ''" correspondrait a N'IMPORTE QUEL telephone : une
            // recherche sans aucun chiffre ("Moussa") ne doit pas ajouter ce
            // critere, sinon il rend le OR entier toujours vrai et annule le
            // filtre par nom.
            ...(chiffres ? [{ telephone: { contains: chiffres } }] : []),
          ],
        }
      : {}),
  };

  // Une seule aller-retour reseau pour les deux requetes.
  const [adherents, total] = await Promise.all([
    prisma.adherent.findMany({
      where,
      orderBy: { creeLe: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
    }),
    prisma.adherent.count({ where }),
  ]);

  return {
    adherents,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
  };
}

export async function compterParStatut() {
  const { gymId } = await getTenantContext();

  const lignes = await prisma.adherent.groupBy({
    by: ["statut"],
    where: { gymId },
    _count: { _all: true },
  });

  const compteurs = Object.fromEntries(
    lignes.map((l) => [l.statut, l._count._all]),
  ) as Partial<Record<StatutAdherent, number>>;

  const total = lignes.reduce((s, l) => s + l._count._all, 0);
  return { compteurs, total };
}

export async function trouverAdherent(id: string) {
  const { gymId } = await getTenantContext();

  // findFirst et non findUnique : findUnique ne cherche que sur la cle
  // primaire, on ne pourrait pas y ajouter le filtre gymId. Sans lui,
  // connaitre l'id d'un adherent d'une autre salle suffirait a le lire.
  return prisma.adherent.findFirst({ where: { id, gymId } });
}

/* --- Modification -------------------------------------------------------- */

/**
 * Met a jour les informations d'un adherent.
 *
 * updateMany et non update, pour la meme raison que partout ailleurs : update
 * n'accepte qu'un critere unique, donc pas de gymId. Sans ce filtre, connaitre
 * l'id d'un adherent d'une autre salle suffirait a reecrire sa fiche.
 *
 * Le numero et le statut ne sont PAS modifiables ici :
 *  - le numero est fige a la creation (§8, jamais reattribue) ;
 *  - le statut passe par changerStatutAdherent, qui a sa propre liste blanche.
 */
export async function modifierAdherent(id: string, donnees: NouvelAdherent) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.adherent.updateMany({
    where: { id, gymId },
    data: {
      prenom: donnees.prenom,
      nom: donnees.nom,
      telephone: donnees.telephone!,
      email: donnees.email || null,
      sexe: donnees.sexe ?? null,
      dateNaissance: donnees.dateNaissance ?? null,
      adresse: donnees.adresse || null,
      notes: donnees.notes || null,
    },
  });

  if (resultat.count === 0) throw new Error("Adherent introuvable");
}

/* --- Changement de statut ------------------------------------------------ */

/**
 * Suspendre, reactiver ou archiver un adherent.
 *
 * On n'utilise PAS prisma.adherent.update() : comme findUnique, il n'accepte
 * qu'un critere unique, donc impossible d'y ajouter gymId. Sans ce filtre,
 * connaitre l'id d'un adherent d'une autre salle suffirait a le suspendre.
 * updateMany accepte un where libre : le gymId y entre.
 *
 * count === 0 signifie soit "id inexistant", soit "id d'une autre salle".
 * On ne distingue pas les deux : repondre "cet adherent existe mais n'est pas
 * a vous" serait deja une fuite d'information.
 */
export async function changerStatutAdherent(
  id: string,
  statut: StatutAdherent,
) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.adherent.updateMany({
    where: { id, gymId },
    data: { statut },
  });

  if (resultat.count === 0) throw new Error("Adherent introuvable");
}

/* --- Creation ------------------------------------------------------------ */

export const schemaNouvelAdherent = z.object({
  prenom: z.string().trim().min(2, "Le prenom est trop court").max(60),
  nom: z.string().trim().min(2, "Le nom est trop court").max(60),
  telephone: z
    .string()
    .trim()
    .transform((v) => normaliserTelephone(v))
    .refine((v) => v !== null, "Numero senegalais invalide (ex : 77 123 45 67)"),
  email: z.email("Adresse e-mail invalide").optional().or(z.literal("")),
  sexe: z.enum(["HOMME", "FEMME"]).optional(),
  dateNaissance: z.coerce.date().optional(),
  adresse: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type NouvelAdherent = z.infer<typeof schemaNouvelAdherent>;

export async function creerAdherent(donnees: NouvelAdherent) {
  const { gymId } = await getTenantContext();

  // Transaction : l'increment du compteur et la creation doivent reussir ou
  // echouer ensemble. Sinon deux receptionnistes qui enregistrent en meme
  // temps pourraient obtenir le meme numero.
  return prisma.$transaction(async (tx) => {
    const gym = await tx.gym.update({
      where: { id: gymId },
      data: { dernierNumeroAdherent: { increment: 1 } },
      select: { dernierNumeroAdherent: true },
    });

    return tx.adherent.create({
      data: {
        gymId,
        numero: formatNumeroAdherent(gym.dernierNumeroAdherent),
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone!,
        email: donnees.email || null,
        sexe: donnees.sexe ?? null,
        dateNaissance: donnees.dateNaissance ?? null,
        adresse: donnees.adresse || null,
        notes: donnees.notes || null,
      },
    });
  });
}

/* --- Import CSV ------------------------------------------------------------
   Bascule d'une salle depuis son carnet papier/Excel : creer 200-400 fiches
   une par une n'est pas realiste. L'import passe par les DEUX memes barrieres
   que la creation manuelle (schemaNouvelAdherent, tenant resolu serveur) —
   ce n'est pas une voie parallele avec ses propres regles. */

/**
 * Parmi une liste de telephones normalises, ceux deja utilises dans la
 * salle. Sert a l'apercu d'import : on n'ecrase jamais une fiche existante
 * (§9), donc un doublon est ecarte plutot que fusionne.
 */
export async function telephonesExistants(
  telephones: string[],
): Promise<Set<string>> {
  const { gymId } = await getTenantContext();
  if (telephones.length === 0) return new Set();

  const lignes = await prisma.adherent.findMany({
    where: { gymId, telephone: { in: telephones } },
    select: { telephone: true },
  });
  return new Set(lignes.map((l) => l.telephone));
}

/**
 * Cree plusieurs adherents en une seule transaction, avec une numerotation
 * FITT-XXXX sequentielle (§8) — meme garantie que creerAdherent (le verrou
 * de la transaction empeche deux imports simultanes de se chevaucher), mais
 * l'increment se fait en un seul coup pour tout le lot.
 *
 * skipDuplicates protege contre une re-soumission du meme fichier (double
 * clic, page rechargee) : le numero reserve pour une ligne ignoree n'est
 * simplement pas reattribue, conformement au §8.
 */
export async function importerAdherents(lignes: NouvelAdherent[]) {
  const { gymId } = await getTenantContext();
  if (lignes.length === 0) return { creees: 0 };

  return prisma.$transaction(async (tx) => {
    const gym = await tx.gym.update({
      where: { id: gymId },
      data: { dernierNumeroAdherent: { increment: lignes.length } },
      select: { dernierNumeroAdherent: true },
    });

    const premierNumero = gym.dernierNumeroAdherent - lignes.length + 1;

    const resultat = await tx.adherent.createMany({
      data: lignes.map((donnees, index) => ({
        gymId,
        numero: formatNumeroAdherent(premierNumero + index),
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone!,
        email: donnees.email || null,
        sexe: donnees.sexe ?? null,
        dateNaissance: donnees.dateNaissance ?? null,
        adresse: donnees.adresse || null,
        notes: donnees.notes || null,
      })),
      skipDuplicates: true,
    });

    return { creees: resultat.count };
  });
}
