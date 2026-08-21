// Acces aux donnees du catalogue des types de cours ("Yoga", "Cross-training"...).
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function listerTypesCours({ inclureArchives = false } = {}) {
  const { gymId } = await getTenantContext();

  return prisma.typeCours.findMany({
    where: { gymId, ...(inclureArchives ? {} : { actif: true }) },
    orderBy: [{ actif: "desc" }, { ordre: "asc" }, { nom: "asc" }],
    // Le nombre de seances programmees : sert a l'affichage, et explique
    // pourquoi un type ne se supprime pas (§9, meme logique que Formule).
    include: { _count: { select: { sessions: true } } },
  });
}

export async function trouverTypeCours(id: string) {
  const { gymId } = await getTenantContext();
  // findFirst, jamais findUnique : lui seul accepte le filtre gymId.
  return prisma.typeCours.findFirst({ where: { id, gymId } });
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export const schemaTypeCours = z.object({
  nom: z.string().trim().min(2, "Le nom est trop court").max(60),
  description: z.string().trim().max(200).optional(),
  couleur: z
    .string()
    .trim()
    .regex(HEX, "Couleur invalide (format hexadecimal, ex : #FF6B35)")
    .optional()
    .or(z.literal("")),
  dureeMinutes: z.coerce
    .number()
    .int()
    .min(10, "La duree doit valoir au moins 10 minutes")
    .max(480, "Duree trop longue"),
  capaciteDefaut: z.coerce
    .number()
    .int()
    .min(1, "La capacite doit valoir au moins 1")
    .max(200, "Capacite trop grande"),
  ordre: z.coerce.number().int().min(0).max(99).optional(),
});

export type DonneesTypeCours = z.infer<typeof schemaTypeCours>;

export async function creerTypeCours(donnees: DonneesTypeCours) {
  const { gymId } = await getTenantContext();

  return prisma.typeCours.create({
    data: {
      gymId,
      nom: donnees.nom,
      description: donnees.description || null,
      couleur: donnees.couleur || "#FF6B35",
      dureeMinutes: donnees.dureeMinutes,
      capaciteDefaut: donnees.capaciteDefaut,
      ordre: donnees.ordre ?? 0,
    },
  });
}

export async function modifierTypeCours(id: string, donnees: DonneesTypeCours) {
  const { gymId } = await getTenantContext();

  // Modifier la duree/capacite par defaut d'un type ne touche AUCUNE seance
  // deja planifiee : celles-ci ont copie ces valeurs a leur creation, sur le
  // meme principe que Abonnement.prixPaye (§9).
  const resultat = await prisma.typeCours.updateMany({
    where: { id, gymId },
    data: {
      nom: donnees.nom,
      description: donnees.description || null,
      couleur: donnees.couleur || "#FF6B35",
      dureeMinutes: donnees.dureeMinutes,
      capaciteDefaut: donnees.capaciteDefaut,
      ordre: donnees.ordre ?? 0,
    },
  });

  if (resultat.count === 0) throw new Error("Type de cours introuvable");
}

/**
 * Archive ou reactive un type de cours.
 *
 * Il n'existe volontairement AUCUNE fonction de suppression (§9) : un type
 * supprime rendrait illisibles toutes les seances qui le citent. La cle
 * etrangere en RESTRICT l'interdirait de toute facon.
 */
export async function basculerArchivageTypeCours(id: string, actif: boolean) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.typeCours.updateMany({
    where: { id, gymId },
    data: { actif },
  });

  if (resultat.count === 0) throw new Error("Type de cours introuvable");
}
