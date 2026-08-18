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
            { telephone: { contains: termes.replace(/\D/g, "") } },
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
