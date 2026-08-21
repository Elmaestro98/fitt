// Acces aux donnees des coachs.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { normaliserTelephone } from "@/lib/utils/telephone";

export async function listerCoachs({ inclureArchives = false } = {}) {
  const { gymId } = await getTenantContext();

  return prisma.coach.findMany({
    where: { gymId, ...(inclureArchives ? {} : { actif: true }) },
    orderBy: [{ actif: "desc" }, { prenom: "asc" }],
    // Le nombre de seances animees : sert a l'affichage, et explique pourquoi
    // un coach ne se supprime pas (§9, meme logique que Formule).
    include: { _count: { select: { sessionsCours: true } } },
  });
}

export async function trouverCoach(id: string) {
  const { gymId } = await getTenantContext();
  // findFirst, jamais findUnique : lui seul accepte le filtre gymId.
  return prisma.coach.findFirst({ where: { id, gymId } });
}

export const schemaCoach = z.object({
  prenom: z.string().trim().min(2, "Le prenom est trop court").max(60),
  nom: z.string().trim().min(2, "Le nom est trop court").max(60),
  telephone: z
    .string()
    .trim()
    .transform((v) => normaliserTelephone(v))
    .refine((v) => v !== null, "Numero senegalais invalide (ex : 77 123 45 67)")
    .optional()
    .or(z.literal("")),
  specialite: z.string().trim().max(120).optional(),
});

export type DonneesCoach = z.infer<typeof schemaCoach>;

export async function creerCoach(donnees: DonneesCoach) {
  const { gymId } = await getTenantContext();

  return prisma.coach.create({
    data: {
      gymId,
      prenom: donnees.prenom,
      nom: donnees.nom,
      telephone: donnees.telephone || null,
      specialite: donnees.specialite || null,
    },
  });
}

export async function modifierCoach(id: string, donnees: DonneesCoach) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.coach.updateMany({
    where: { id, gymId },
    data: {
      prenom: donnees.prenom,
      nom: donnees.nom,
      telephone: donnees.telephone || null,
      specialite: donnees.specialite || null,
    },
  });

  if (resultat.count === 0) throw new Error("Coach introuvable");
}

/**
 * Archive ou reactive un coach.
 *
 * Il n'existe volontairement AUCUNE fonction de suppression (§9) : un coach
 * supprime rendrait illisibles toutes les seances qu'il a animees. La cle
 * etrangere en RESTRICT l'interdirait de toute facon.
 */
export async function basculerArchivageCoach(id: string, actif: boolean) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.coach.updateMany({
    where: { id, gymId },
    data: { actif },
  });

  if (resultat.count === 0) throw new Error("Coach introuvable");
}
