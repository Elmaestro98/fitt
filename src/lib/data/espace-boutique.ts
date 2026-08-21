// =============================================================================
// La boutique vue par l'ADHERENT : catalogue, passage de commande, historique.
//
// Fichier separe de data/produit.ts pour la meme raison que espace.ts l'est de
// abonnement.ts (§5) : les fonctions de produit.ts commencent toutes par
// getTenantContext(), qui lit la session CLERK. Un adherent n'en a pas, et
// n'en aura jamais.
//
//   back-office : gymId <- session Clerk        (getTenantContext)
//   espace      : gymId <- session adherent     (exigerSessionAdherent)
//
// Aucune fonction d'ici n'accepte de gymId ni d'adherentId en parametre : un
// adherent ne peut donc pas commander pour un autre, ni lire les commandes
// d'une autre salle, meme en forgeant la requete.
// =============================================================================
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigerSessionAdherent } from "@/lib/session-adherent";

/** Le catalogue tel que l'adherent le voit : les produits en vente, jamais
 *  les archives (contrairement au back-office, ou le gerant doit pouvoir les
 *  retrouver). */
export async function catalogueEspace() {
  const { gymId } = await exigerSessionAdherent();

  return prisma.produit.findMany({
    where: { gymId, actif: true },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: {
      id: true,
      nom: true,
      description: true,
      prix: true,
      photoUrl: true,
    },
  });
}

/* --- Passage de commande --------------------------------------------------- */

/** Plafond par ligne : au-dela, c'est une commande de gros qui se discute a
 *  l'accueil, pas un panier d'adherent. */
const QUANTITE_MAX = 20;
/** Plafond de lignes distinctes dans un panier. Le panier n'est jamais rejoue
 *  en bloc (contrairement a la file du kiosque, §6) : l'adherent peut retirer
 *  un article, il n'y a donc pas de risque de blocage definitif. */
const LIGNES_MAX = 20;

export const schemaPanier = z
  .array(
    z.object({
      produitId: z.string().trim().min(1),
      quantite: z.coerce.number().int().min(1).max(QUANTITE_MAX),
    }),
  )
  .min(1, "Votre panier est vide.")
  .max(LIGNES_MAX, `Un panier ne peut pas depasser ${LIGNES_MAX} articles differents.`);

export type LignePanier = z.infer<typeof schemaPanier>[number];

export type ResultatCommande =
  | { ok: true; commandeId: string }
  | { ok: false; raison: "panier-vide" | "produit-indisponible" };

/**
 * Enregistre la commande de l'adherent.
 *
 * /!\ Les prix ne sont JAMAIS lus depuis le navigateur : le panier n'envoie
 * que des identifiants et des quantites, et les tarifs sont relus en base
 * ici. Sans cela, n'importe qui pourrait commander a 0 FCFA en bricolant la
 * requete.
 *
 * /!\ nomProduit et prixUnitaire sont ensuite FIGES dans chaque ligne (§9,
 * meme principe que Abonnement.prixPaye) : un changement de tarif demain ne
 * doit pas reecrire cette commande.
 *
 * Aucun verrou de concurrence ici, contrairement aux places d'une seance
 * (§6) : la disponibilite est un simple drapeau tenu a la main par le staff,
 * il n'y a aucun compteur que deux commandes simultanees pourraient
 * decrementer en double.
 */
export async function passerCommande(
  lignes: LignePanier[],
): Promise<ResultatCommande> {
  const { gymId, adherentId } = await exigerSessionAdherent();

  // Le meme produit peut arriver sur deux lignes si le panier a ete bricole :
  // on additionne plutot que de creer deux lignes pour un meme article.
  const quantiteParProduit = new Map<string, number>();
  for (const ligne of lignes) {
    const dejaVu = quantiteParProduit.get(ligne.produitId) ?? 0;
    quantiteParProduit.set(
      ligne.produitId,
      Math.min(dejaVu + ligne.quantite, QUANTITE_MAX),
    );
  }

  const ids = [...quantiteParProduit.keys()];
  if (ids.length === 0) return { ok: false, raison: "panier-vide" };

  // Le filtre gymId + actif est ce qui empeche de commander le produit d'une
  // autre salle, ou un produit retire de la vente entre l'affichage de la
  // page et l'envoi du panier.
  const produits = await prisma.produit.findMany({
    where: { gymId, actif: true, id: { in: ids } },
    select: { id: true, nom: true, prix: true },
  });

  // Un seul produit manquant fait echouer TOUTE la commande : livrer
  // silencieusement un panier ampute serait pire que de le dire.
  if (produits.length !== ids.length) {
    return { ok: false, raison: "produit-indisponible" };
  }

  const commande = await prisma.commande.create({
    data: {
      gymId,
      adherentId,
      lignes: {
        create: produits.map((produit) => ({
          gymId,
          produitId: produit.id,
          nomProduit: produit.nom,
          prixUnitaire: produit.prix,
          quantite: quantiteParProduit.get(produit.id) ?? 1,
        })),
      },
    },
    select: { id: true },
  });

  return { ok: true, commandeId: commande.id };
}

/* --- Historique ------------------------------------------------------------ */

export async function mesCommandesEspace() {
  const { gymId, adherentId } = await exigerSessionAdherent();

  return prisma.commande.findMany({
    where: { gymId, adherentId },
    orderBy: { creeLe: "desc" },
    select: {
      id: true,
      statut: true,
      creeLe: true,
      recupereeLe: true,
      annuleeLe: true,
      motifAnnul: true,
      note: true,
      lignes: {
        select: {
          id: true,
          nomProduit: true,
          prixUnitaire: true,
          quantite: true,
        },
      },
    },
  });
}

/**
 * Annulation par l'adherent lui-meme.
 *
 * Uniquement tant que la commande est EN_ATTENTE : une fois que le staff l'a
 * preparee (PRETE), c'est a l'accueil que ca se regle — des produits ont ete
 * mis de cote. La commande n'est jamais supprimee, seulement marquee (§9).
 */
export async function annulerMaCommande(commandeId: string): Promise<boolean> {
  const { gymId, adherentId } = await exigerSessionAdherent();

  // updateMany plutot que update : lui seul accepte un where composite, donc
  // le filtre gymId + adherentId. C'est ce filtre qui interdit d'annuler la
  // commande de quelqu'un d'autre en changeant l'identifiant.
  const resultat = await prisma.commande.updateMany({
    where: { id: commandeId, gymId, adherentId, statut: "EN_ATTENTE" },
    data: {
      statut: "ANNULEE",
      annuleeLe: new Date(),
      motifAnnul: "Annulee par l'adherent",
    },
  });

  return resultat.count === 1;
}
