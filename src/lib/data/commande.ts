// Gestion des commandes de la boutique, cote STAFF (CLAUDE.md §7).
//
// Le pendant cote adherent vit dans data/espace-boutique.ts : celui-la tourne
// sous session adherent, celui-ci sous session Clerk (§5).
//
// Cycle de vie d'une commande :
//   EN_ATTENTE --> PRETE --> RECUPEREE   (le chemin normal)
//   EN_ATTENTE --> RECUPEREE             (l'adherent est deja au comptoir)
//   EN_ATTENTE | PRETE --> ANNULEE
// RECUPEREE et ANNULEE sont des etats FINAUX : de l'argent a change de mains,
// ou la commande a ete abandonnee. Aucune transition n'en repart.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { METHODES } from "@/lib/data/paiement";
import { totalCommande } from "@/lib/utils/commande";

const SELECTION_LIGNES = {
  select: {
    id: true,
    nomProduit: true,
    prixUnitaire: true,
    quantite: true,
  },
} as const;

const SELECTION_ADHERENT = {
  select: {
    id: true,
    numero: true,
    prenom: true,
    nom: true,
    telephone: true,
    photoUrl: true,
  },
} as const;

export type FiltreCommandes = "en_cours" | "toutes";

/**
 * Les commandes de la salle.
 *
 * "en_cours" par defaut cote page : c'est la seule liste qui demande une
 * action au staff. L'historique complet reste accessible, mais il ne doit pas
 * noyer les deux commandes du jour qu'il faut preparer.
 */
export async function listerCommandes(filtre: FiltreCommandes = "en_cours") {
  const { gymId } = await getTenantContext();

  return prisma.commande.findMany({
    where: {
      gymId,
      ...(filtre === "en_cours"
        ? { statut: { in: ["EN_ATTENTE", "PRETE"] } }
        : {}),
    },
    // Les plus anciennes d'abord dans la file d'attente : une commande passee
    // ce matin doit etre traitee avant celle d'il y a dix minutes.
    orderBy: { creeLe: filtre === "en_cours" ? "asc" : "desc" },
    select: {
      id: true,
      statut: true,
      creeLe: true,
      recupereeLe: true,
      annuleeLe: true,
      motifAnnul: true,
      note: true,
      adherent: SELECTION_ADHERENT,
      lignes: SELECTION_LIGNES,
    },
  });
}

/** Le compteur affiche dans la navigation : combien de commandes attendent
 *  une action du staff. */
export async function compterCommandesATraiter() {
  const { gymId } = await getTenantContext();

  return prisma.commande.count({
    where: { gymId, statut: { in: ["EN_ATTENTE", "PRETE"] } },
  });
}

/* --- Transitions ----------------------------------------------------------- */

/**
 * Marque une commande comme preparee.
 *
 * updateMany plutot que update : lui seul accepte le filtre gymId, et la
 * condition sur le statut fait office de verrou optimiste (§6) — deux membres
 * du staff qui cliquent en meme temps ne produisent qu'une seule transition.
 */
export async function marquerCommandePrete(id: string): Promise<boolean> {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.commande.updateMany({
    where: { id, gymId, statut: "EN_ATTENTE" },
    data: { statut: "PRETE" },
  });

  return resultat.count === 1;
}

export const schemaRemise = z.object({
  methode: z.enum(METHODES),
  reference: z.string().trim().max(60).optional(),
});

export type DonneesRemise = z.infer<typeof schemaRemise>;

export type ResultatRemise =
  | { ok: true; montant: number }
  | { ok: false; raison: "introuvable" | "deja-traitee" };

/**
 * Remet la commande a l'adherent et encaisse le reglement.
 *
 * /!\ Les deux ecritures sont dans UNE transaction : une commande marquee
 * recuperee sans ligne de caisse serait de la marchandise sortie sans trace
 * comptable, et une ligne de caisse sans commande recuperee ferait payer
 * l'adherent deux fois.
 *
 * /!\ Le montant n'est PAS saisi par le staff : il est recalcule depuis les
 * lignes figees de la commande (§9). Aucun risque de faute de frappe entre ce
 * que l'adherent a commande et ce qu'on lui fait payer.
 *
 * Le passage a RECUPEREE sert de verrou optimiste (§6) : c'est ce qui empeche
 * un double clic de creer deux encaissements pour la meme commande.
 */
export async function remettreCommande(
  id: string,
  donnees: DonneesRemise,
): Promise<ResultatRemise> {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    const commande = await tx.commande.findFirst({
      where: { id, gymId },
      select: {
        statut: true,
        adherentId: true,
        lignes: { select: { prixUnitaire: true, quantite: true } },
      },
    });

    if (!commande) return { ok: false, raison: "introuvable" as const };

    const montant = totalCommande(commande.lignes);

    // Verrou optimiste : la transition n'a lieu que si le statut est encore
    // celui qu'on vient de lire. Si un collegue est passe entre-temps, count
    // vaut 0 et rien n'est encaisse.
    const transition = await tx.commande.updateMany({
      where: { id, gymId, statut: { in: ["EN_ATTENTE", "PRETE"] } },
      data: { statut: "RECUPEREE", recupereeLe: new Date() },
    });

    if (transition.count !== 1) {
      return { ok: false, raison: "deja-traitee" as const };
    }

    // Une commande a 0 FCFA (produits offerts) ne genere pas de ligne de
    // caisse : le journal enregistre des mouvements d'argent, pas des
    // evenements. schemaPaiement refuserait d'ailleurs un montant nul.
    if (montant > 0) {
      await tx.paiement.create({
        data: {
          gymId,
          adherentId: commande.adherentId,
          commandeId: id,
          montant,
          methode: donnees.methode,
          type: "ENCAISSEMENT",
          reference: donnees.reference || null,
          note: "Commande boutique",
          encaisseLe: new Date(),
        },
      });
    }

    return { ok: true as const, montant };
  });
}

/**
 * Annule une commande, avec motif obligatoire (esprit du §9).
 *
 * Impossible sur une commande RECUPEREE : l'argent est encaisse, et un
 * encaissement ne s'efface pas — il s'annule par ecriture de contrepartie,
 * depuis le journal de caisse (annulerPaiement). Les deux gestes sont
 * distincts et le restent.
 */
export async function annulerCommande(
  id: string,
  motif: string,
): Promise<boolean> {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.commande.updateMany({
    where: { id, gymId, statut: { in: ["EN_ATTENTE", "PRETE"] } },
    data: { statut: "ANNULEE", annuleeLe: new Date(), motifAnnul: motif },
  });

  return resultat.count === 1;
}
