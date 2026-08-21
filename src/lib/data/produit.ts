// Acces aux donnees du catalogue de la boutique (CLAUDE.md §7 : un fichier
// par entite). Cote staff uniquement — le pendant cote adherent vit dans
// data/espace.ts, comme pour le reste de l'espace (accueilEspace, etc.).
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { televerserPhotoProduit } from "@/lib/data/stockage";

export async function listerProduits({ inclureArchives = false } = {}) {
  const { gymId } = await getTenantContext();

  return prisma.produit.findMany({
    where: { gymId, ...(inclureArchives ? {} : { actif: true }) },
    orderBy: [{ actif: "desc" }, { ordre: "asc" }, { nom: "asc" }],
    // Le nombre de lignes de commande deja vendues : c'est lui qui interdit
    // la suppression et impose l'archivage (§9), meme logique que Formule.
    include: { _count: { select: { lignesCommande: true } } },
  });
}

export async function trouverProduit(id: string) {
  const { gymId } = await getTenantContext();
  // findFirst, jamais findUnique : lui seul accepte le filtre gymId.
  return prisma.produit.findFirst({ where: { id, gymId } });
}

export const schemaProduit = z.object({
  nom: z.string().trim().min(2, "Le nom est trop court").max(80),
  description: z.string().trim().max(300).optional(),
  prix: z.coerce
    .number()
    .int("Le prix doit etre un entier en FCFA, sans centimes")
    .min(0, "Le prix ne peut pas etre negatif")
    .max(100_000_000, "Ce montant parait errone"),
  ordre: z.coerce.number().int().min(0).max(99).optional(),
});

export type DonneesProduit = z.infer<typeof schemaProduit>;

/**
 * Ce que le formulaire demande de faire de la photo.
 *
 * Les trois cas sont distincts et doivent le rester : a la modification,
 * "ne rien envoyer" ne veut PAS dire "retirer la photo" — sans cette
 * distinction, chaque changement de prix effacerait l'image du produit.
 */
export type IntentionPhoto =
  | { action: "inchangee" }
  | { action: "remplacee"; fichier: File }
  | { action: "retiree" };

export async function creerProduit(
  donnees: DonneesProduit,
  photo: IntentionPhoto = { action: "inchangee" },
) {
  const { gymId } = await getTenantContext();

  // Le televersement a lieu AVANT l'ecriture, et hors transaction : garder
  // une transaction Prisma ouverte pendant un appel reseau externe
  // immobiliserait une connexion du pool pour la duree du transfert.
  const photoUrl =
    photo.action === "remplacee"
      ? await televerserPhotoProduit(gymId, photo.fichier)
      : null;

  return prisma.produit.create({
    data: {
      gymId,
      nom: donnees.nom,
      description: donnees.description || null,
      prix: donnees.prix,
      photoUrl,
      ordre: donnees.ordre ?? 0,
    },
  });
}

export async function modifierProduit(
  id: string,
  donnees: DonneesProduit,
  photo: IntentionPhoto = { action: "inchangee" },
) {
  const { gymId } = await getTenantContext();

  const photoUrl =
    photo.action === "remplacee"
      ? await televerserPhotoProduit(gymId, photo.fichier)
      : null;

  // Modifier le prix d'un produit ne touche AUCUNE commande deja passee :
  // LigneCommande garde une copie figee du prix au moment de la vente (§9),
  // meme principe que Abonnement.prixPaye.
  const resultat = await prisma.produit.updateMany({
    where: { id, gymId },
    data: {
      nom: donnees.nom,
      description: donnees.description || null,
      prix: donnees.prix,
      ordre: donnees.ordre ?? 0,
      // Champ volontairement absent quand la photo est inchangee : l'omettre
      // laisse la valeur en base, alors que photoUrl: null l'effacerait.
      ...(photo.action === "remplacee" ? { photoUrl } : {}),
      ...(photo.action === "retiree" ? { photoUrl: null } : {}),
    },
  });

  if (resultat.count === 0) throw new Error("Produit introuvable");
}

/**
 * Archive ou remet en vente un produit.
 *
 * Il n'existe volontairement AUCUNE fonction de suppression (§9) : un
 * produit supprime rendrait illisibles toutes les commandes qui le citent.
 * La cle etrangere en RESTRICT l'interdirait de toute facon.
 */
export async function basculerArchivageProduit(id: string, actif: boolean) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.produit.updateMany({
    where: { id, gymId },
    data: { actif },
  });

  if (resultat.count === 0) throw new Error("Produit introuvable");
}
