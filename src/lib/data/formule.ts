// Acces aux donnees des formules d'abonnement.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function listerFormules({ inclureArchivees = false } = {}) {
  const { gymId } = await getTenantContext();

  return prisma.formule.findMany({
    where: { gymId, ...(inclureArchivees ? {} : { actif: true }) },
    orderBy: [{ actif: "desc" }, { ordre: "asc" }, { prix: "asc" }],
    // Le nombre d'abonnements souscrits : c'est lui qui interdit la
    // suppression et impose l'archivage (§9).
    include: { _count: { select: { abonnements: true } } },
  });
}

export async function trouverFormule(id: string) {
  const { gymId } = await getTenantContext();
  // findFirst, jamais findUnique : lui seul accepte le filtre gymId.
  return prisma.formule.findFirst({ where: { id, gymId } });
}

export const schemaFormule = z.object({
  nom: z.string().trim().min(2, "Le nom est trop court").max(60),
  description: z.string().trim().max(200).optional(),
  prix: z.coerce
    .number()
    .int("Le prix doit etre un entier en FCFA, sans centimes")
    .min(0, "Le prix ne peut pas etre negatif")
    .max(100_000_000, "Ce montant parait errone"),
  dureeValeur: z.coerce
    .number()
    .int()
    .min(1, "La duree doit valoir au moins 1")
    .max(120, "Duree trop longue"),
  dureeUnite: z.enum(["JOUR", "SEMAINE", "MOIS", "ANNEE"]),
  ordre: z.coerce.number().int().min(0).max(99).optional(),
});

export type DonneesFormule = z.infer<typeof schemaFormule>;

export async function creerFormule(donnees: DonneesFormule) {
  const { gymId } = await getTenantContext();

  return prisma.formule.create({
    data: {
      gymId,
      nom: donnees.nom,
      description: donnees.description || null,
      prix: donnees.prix,
      dureeValeur: donnees.dureeValeur,
      dureeUnite: donnees.dureeUnite,
      ordre: donnees.ordre ?? 0,
    },
  });
}

export async function modifierFormule(id: string, donnees: DonneesFormule) {
  const { gymId } = await getTenantContext();

  // Modifier le prix d'une formule ne touche AUCUN abonnement deja souscrit :
  // ceux-ci ont copie le tarif au moment de la vente (§9). C'est toute la
  // raison d'etre de Abonnement.prixPaye.
  const resultat = await prisma.formule.updateMany({
    where: { id, gymId },
    data: {
      nom: donnees.nom,
      description: donnees.description || null,
      prix: donnees.prix,
      dureeValeur: donnees.dureeValeur,
      dureeUnite: donnees.dureeUnite,
      ordre: donnees.ordre ?? 0,
    },
  });

  if (resultat.count === 0) throw new Error("Formule introuvable");
}

/**
 * Archive ou reactive une formule.
 *
 * Il n'existe volontairement AUCUNE fonction de suppression (§9) : une
 * formule supprimee rendrait illisibles tous les abonnements qui la citent.
 * La cle etrangere en RESTRICT l'interdirait de toute facon.
 */
export async function basculerArchivageFormule(id: string, actif: boolean) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.formule.updateMany({
    where: { id, gymId },
    data: { actif },
  });

  if (resultat.count === 0) throw new Error("Formule introuvable");
}
