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
import { televerserPhotoAdherent } from "@/lib/data/stockage";
import type { StatutAdherent } from "@/generated/prisma/enums";

/* Pagination cote serveur des la premiere ligne (CLAUDE.md §7) : une salle de
   400 adherents ne doit jamais tout charger d'un coup. */
export const PAR_PAGE = 25;

export type FiltresAdherents = {
  page?: number;
  recherche?: string;
  statut?: StatutAdherent;
};

/**
 * Le critere "ce texte correspond a un adherent", partage par la liste
 * paginee et la recherche globale de la barre haute.
 *
 * /!\ Ecrit UNE fois et reutilise : c'est ici que se logeait le bug du
 * `contains: ""` (§6), et le dupliquer serait le meilleur moyen de le
 * reintroduire ailleurs.
 *
 * Renvoie un objet vide quand il n'y a rien a chercher, pour pouvoir
 * l'etaler dans un `where` sans condition a l'appel.
 */
function critereRecherche(recherche?: string) {
  const termes = recherche?.trim();
  if (!termes) return {};

  const chiffres = termes.replace(/\D/g, "");

  return {
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
  };
}

export async function listerAdherents({
  page = 1,
  recherche,
  statut,
}: FiltresAdherents = {}) {
  const { gymId } = await getTenantContext();

  // Le gymId est toujours present dans le where. Les autres criteres
  // viennent s'ajouter, jamais le remplacer.
  const where = {
    gymId,
    ...(statut ? { statut } : {}),
    ...critereRecherche(recherche),
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

/** Nombre de suggestions de la barre haute. Volontairement court : c'est une
 *  liste deroulante qu'on parcourt d'un coup d'oeil, pas un resultat de
 *  recherche. Au-dela, le lien "voir tous les resultats" renvoie vers la page
 *  Adherents, qui pagine. */
const SUGGESTIONS_MAX = 6;

/**
 * Recherche pour la barre haute du back-office.
 *
 * Distincte de listerAdherents : elle ne pagine pas, ne compte pas, et ne
 * ramene que les quelques champs affiches dans la liste deroulante. A
 * l'accueil, quelqu'un se presente et le staff tape son nom — la reponse doit
 * arriver avant qu'il ait fini de taper.
 */
export async function rechercheRapideAdherents(recherche: string) {
  const { gymId } = await getTenantContext();

  const termes = recherche.trim();
  // Une lettre unique renverrait la moitie du fichier pour rien : la barre
  // n'interroge la base qu'a partir de deux caracteres.
  if (termes.length < 2) return { resultats: [], total: 0 };

  const where = { gymId, ...critereRecherche(termes) };

  const [resultats, total] = await Promise.all([
    prisma.adherent.findMany({
      where,
      take: SUGGESTIONS_MAX,
      orderBy: { creeLe: "desc" },
      select: {
        id: true,
        numero: true,
        prenom: true,
        nom: true,
        telephone: true,
        photoUrl: true,
        statut: true,
      },
    }),
    prisma.adherent.count({ where }),
  ]);

  return { resultats, total };
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
 * Ce que le formulaire demande de faire de la photo (meme principe que
 * IntentionPhoto dans lib/data/produit.ts).
 *
 * "Ne rien envoyer" ne veut PAS dire "retirer la photo" : sans cette
 * distinction, chaque modification de fiche effacerait la photo existante.
 */
export type IntentionPhotoAdherent =
  | { action: "inchangee" }
  | { action: "remplacee"; fichier: File }
  | { action: "retiree" };

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
export async function modifierAdherent(
  id: string,
  donnees: NouvelAdherent,
  photo: IntentionPhotoAdherent = { action: "inchangee" },
) {
  const { gymId } = await getTenantContext();

  // Le televersement a lieu AVANT l'ecriture, hors de toute transaction —
  // meme raison que creerAdherent : ne pas immobiliser une connexion du pool
  // pendant l'appel reseau vers Supabase Storage.
  const photoUrl =
    photo.action === "remplacee"
      ? await televerserPhotoAdherent(gymId, photo.fichier)
      : null;

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
      // Champ volontairement absent quand la photo est inchangee : l'omettre
      // laisse la valeur en base, alors que photoUrl: null l'effacerait.
      ...(photo.action === "remplacee" ? { photoUrl } : {}),
      ...(photo.action === "retiree" ? { photoUrl: null } : {}),
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

/**
 * @param photo Facultative (§4 : une salle qui saisit 300 adherents au
 *   carnet ne mettra pas 300 photos). "retiree" n'a pas de sens ici — il n'y
 *   a encore aucune photo a enlever — mais accepter le meme type que
 *   modifierAdherent evite une seconde forme d'appel pour un seul appelant
 *   (actionCreerAdherent).
 */
export async function creerAdherent(
  donnees: NouvelAdherent,
  photo: IntentionPhotoAdherent = { action: "inchangee" },
) {
  const { gymId } = await getTenantContext();

  // Le televersement a lieu AVANT la transaction et hors d'elle : garder une
  // transaction Prisma ouverte pendant un appel reseau externe immobiliserait
  // une connexion du pool pour la duree du transfert (meme regle que
  // creerProduit, lib/data/produit.ts).
  const photoUrl =
    photo.action === "remplacee"
      ? await televerserPhotoAdherent(gymId, photo.fichier)
      : null;

  // Transaction : l'increment du compteur et la creation doivent reussir ou
  // echouer ensemble. Sinon deux receptionnistes qui enregistrent en meme
  // temps pourraient obtenir le meme numero.
  return prisma.$transaction(async (tx) => {
    const gym = await tx.gym.update({
      where: { id: gymId },
      data: { dernierNumeroAdherent: { increment: 1 } },
      select: { dernierNumeroAdherent: true, prefixeAdherent: true },
    });

    return tx.adherent.create({
      data: {
        gymId,
        numero: formatNumeroAdherent(
          gym.dernierNumeroAdherent,
          gym.prefixeAdherent,
        ),
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone!,
        email: donnees.email || null,
        sexe: donnees.sexe ?? null,
        dateNaissance: donnees.dateNaissance ?? null,
        adresse: donnees.adresse || null,
        notes: donnees.notes || null,
        photoUrl,
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
 * sequentielle au prefixe de la salle (§8) — meme garantie que creerAdherent (le verrou
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
      select: { dernierNumeroAdherent: true, prefixeAdherent: true },
    });

    const premierNumero = gym.dernierNumeroAdherent - lignes.length + 1;

    const resultat = await tx.adherent.createMany({
      data: lignes.map((donnees, index) => ({
        gymId,
        numero: formatNumeroAdherent(
          premierNumero + index,
          gym.prefixeAdherent,
        ),
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
