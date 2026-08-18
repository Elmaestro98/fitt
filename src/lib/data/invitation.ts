// Liens de pre-inscription (CLAUDE.md §4).
//
// Ce fichier est le SEUL du projet ou le gymId ne vient pas de la session
// Clerk — la page d'inscription est publique, il n'y a personne de connecte.
// Il est donc coupe en deux parties nettement separees :
//
//   1. cote staff  : getTenantContext(), exactement comme partout ailleurs ;
//   2. cote public : le gymId est deduit du JETON, et de rien d'autre.
//
// Le jeton n'est pas un identifiant de salle deguise : c'est un secret de
// 32 octets qu'on ne peut ni deviner ni enumerer, et dont seule l'empreinte
// est stockee. Le §9 interdit d'exposer un gymId dans une URL ; il n'y en a
// jamais aucun ici.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  expirationDans,
  genererJeton,
  hacherJeton,
  JOURS_VALIDITE_DEFAUT,
} from "@/lib/utils/jeton";
import { normaliserTelephone } from "@/lib/utils/telephone";
import { formatNumeroAdherent } from "@/lib/utils/format";

/* =========================================================================
   1. COTE STAFF — tenant resolu par la session, comme partout ailleurs
   ========================================================================= */

export const schemaNouveauLien = z.object({
  libelle: z
    .string()
    .trim()
    .min(3, "Donnez un nom d'au moins 3 caracteres")
    .max(60),
  // Le §4 fixe 7 jours par defaut. On laisse choisir, sans permettre
  // l'eternite : un lien qui ne meurt jamais finit par circuler.
  jours: z.coerce.number().int().min(1).max(90).default(JOURS_VALIDITE_DEFAUT),
  // 0 signifie "illimite" dans le formulaire — plus simple qu'un champ vide.
  usagesMax: z.coerce.number().int().min(0).max(1000).default(1),
});

export type NouveauLien = z.infer<typeof schemaNouveauLien>;

/**
 * Genere un lien de pre-inscription.
 *
 * /!\ Le jeton en clair renvoye ici est la SEULE occasion de le voir. Il
 * n'est pas stocke (§9) : une fois la reponse affichee, il est irrecuperable.
 */
export async function creerLienInscription(donnees: NouveauLien) {
  const { gymId, userId } = await getTenantContext();

  const { clair, hache } = genererJeton();

  const lien = await prisma.lienInscription.create({
    data: {
      gymId,
      jetonHache: hache, // l'empreinte, jamais le clair
      libelle: donnees.libelle,
      expireLe: expirationDans(donnees.jours),
      usagesMax: donnees.usagesMax === 0 ? null : donnees.usagesMax,
      creeParUserId: userId,
    },
  });

  return { lien, jetonClair: clair };
}

export async function listerLiens() {
  const { gymId } = await getTenantContext();

  return prisma.lienInscription.findMany({
    where: { gymId },
    orderBy: { creeLe: "desc" },
    include: { _count: { select: { adherents: true } } },
  });
}

/**
 * Revoque un lien. Immediat et definitif.
 *
 * On ne supprime pas la ligne : les fiches nees de ce lien y font reference,
 * et le gerant doit pouvoir retracer d'ou vient un adherent.
 */
export async function revoquerLien(id: string) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.lienInscription.updateMany({
    where: { id, gymId, revoqueLe: null },
    data: { revoqueLe: new Date() },
  });

  if (resultat.count === 0) {
    throw new Error("Lien introuvable ou deja revoque");
  }
}

/** Les fiches en attente de validation par le staff (§4). */
export async function preinscriptionsEnAttente() {
  const { gymId } = await getTenantContext();

  return prisma.adherent.findMany({
    where: { gymId, statut: "EN_ATTENTE_VALIDATION" },
    orderBy: { creeLe: "desc" },
    include: { lienInscription: { select: { libelle: true } } },
  });
}

/* =========================================================================
   2. COTE PUBLIC — aucune session. Le gymId sort du jeton, point.
   ========================================================================= */

export type EtatLien =
  | { valide: true; lienId: string; gymId: string; gymNom: string }
  | { valide: false; raison: "introuvable" | "expire" | "revoque" | "epuise" };

/**
 * Verifie un jeton et renvoie la salle correspondante.
 *
 * Appelee sans session : c'est le jeton qui fait autorite. Les quatre motifs
 * d'invalidite sont distingues pour pouvoir l'expliquer honnetement au
 * visiteur — mais aucun ne revele l'existence ou le nom d'une salle tant que
 * le jeton n'est pas exact.
 */
export async function verifierJeton(jetonClair: string): Promise<EtatLien> {
  // On cherche par empreinte : le clair ne sert qu'a la calculer.
  const lien = await prisma.lienInscription.findUnique({
    where: { jetonHache: hacherJeton(jetonClair) },
    include: { gym: { select: { id: true, nom: true, actif: true } } },
  });

  if (!lien || !lien.gym.actif) return { valide: false, raison: "introuvable" };
  if (lien.revoqueLe) return { valide: false, raison: "revoque" };
  if (lien.expireLe < new Date()) return { valide: false, raison: "expire" };
  if (lien.usagesMax !== null && lien.usages >= lien.usagesMax) {
    return { valide: false, raison: "epuise" };
  }

  return {
    valide: true,
    lienId: lien.id,
    gymId: lien.gymId,
    gymNom: lien.gym.nom,
  };
}

/* Le formulaire public demande le strict minimum. Pas de notes, pas
   d'adresse : ce que l'adherent saisit lui-meme doit tenir en un ecran de
   telephone, le staff completera. */
export const schemaPreinscription = z.object({
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
});

export type DonneesPreinscription = z.infer<typeof schemaPreinscription>;

export class TelephoneDejaInscritError extends Error {
  constructor() {
    super("Ce numero est deja enregistre dans cette salle");
    this.name = "TelephoneDejaInscritError";
  }
}

export class LienInvalideError extends Error {
  constructor(public raison: string) {
    super("Ce lien n'est plus utilisable");
    this.name = "LienInvalideError";
  }
}

/**
 * Cree une fiche a partir du lien public.
 *
 * /!\ La fiche nait en EN_ATTENTE_VALIDATION (§4). Elle n'est PAS un compte :
 * aucun acces n'est ouvert, aucun utilisateur Clerk n'est cree (§5). Tant que
 * le staff n'a pas valide, cette personne n'est rien d'autre qu'une demande.
 *
 * Tout se joue dans une seule transaction : la re-verification du lien, son
 * compteur d'usages et la creation de la fiche. Sans cela, deux envois
 * simultanes sur un lien a usage unique passeraient tous les deux.
 */
export async function inscrireViaLien(
  jetonClair: string,
  donnees: DonneesPreinscription,
) {
  const empreinte = hacherJeton(jetonClair);

  return prisma.$transaction(async (tx) => {
    const lien = await tx.lienInscription.findUnique({
      where: { jetonHache: empreinte },
      select: {
        id: true,
        gymId: true,
        expireLe: true,
        revoqueLe: true,
        usagesMax: true,
        usages: true,
        gym: { select: { actif: true } },
      },
    });

    // Re-verification COMPLETE a l'interieur de la transaction : le lien a pu
    // etre revoque entre l'affichage du formulaire et son envoi.
    if (!lien || !lien.gym.actif) throw new LienInvalideError("introuvable");
    if (lien.revoqueLe) throw new LienInvalideError("revoque");
    if (lien.expireLe < new Date()) throw new LienInvalideError("expire");
    if (lien.usagesMax !== null && lien.usages >= lien.usagesMax) {
      throw new LienInvalideError("epuise");
    }

    const gymId = lien.gymId;

    // Unicite (gymId, telephone) : la base la garantit, mais un message clair
    // vaut mieux qu'une erreur de contrainte. Deux salles differentes peuvent
    // avoir le meme numero, la meme salle non.
    const existe = await tx.adherent.findFirst({
      where: { gymId, telephone: donnees.telephone! },
      select: { id: true },
    });
    if (existe) throw new TelephoneDejaInscritError();

    // Meme sequence par salle que la creation au comptoir (§8) : un numero
    // libere n'est jamais reattribue.
    const gym = await tx.gym.update({
      where: { id: gymId },
      data: { dernierNumeroAdherent: { increment: 1 } },
      select: { dernierNumeroAdherent: true },
    });

    const adherent = await tx.adherent.create({
      data: {
        gymId,
        numero: formatNumeroAdherent(gym.dernierNumeroAdherent),
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone!,
        email: donnees.email || null,
        sexe: donnees.sexe ?? null,
        dateNaissance: donnees.dateNaissance ?? null,
        // Le point central du §4 : c'est une demande, pas un adherent.
        statut: "EN_ATTENTE_VALIDATION",
        lienInscriptionId: lien.id,
      },
      select: { id: true, prenom: true, numero: true },
    });

    await tx.lienInscription.update({
      where: { id: lien.id },
      data: { usages: { increment: 1 } },
    });

    return adherent;
  });
}
