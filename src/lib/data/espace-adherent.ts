// =============================================================================
// Espace adherent — invitations nominatives et sessions (CLAUDE.md §4, §5).
//
// Comme lib/data/invitation.ts, ce fichier a DEUX moities nettement separees,
// et pour la meme raison :
//
//   1. cote staff  : getTenantContext(), le gymId sort de la session Clerk ;
//   2. cote public : personne n'est connecte, le gymId sort du JETON.
//
// /!\ Ne pas confondre avec lib/data/invitation.ts :
//     LienInscription : anonyme, partageable, CREE une fiche a valider ;
//     Invitation      : nominative, rattachee a un adherent DEJA existant,
//                       et ouvre l'acces a son espace personnel.
//
// /!\ Aucun compte Clerk n'est cree ici, ni ailleurs, pour un adherent (§5,
//     §9). Clerk facture au MAU : une salle de 400 adherents ferait exploser
//     le cout. La session est maison — un jeton dans un cookie httpOnly.
// =============================================================================
import "server-only";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  expirationDans,
  genererJeton,
  hacherJeton,
  JOURS_VALIDITE_DEFAUT,
} from "@/lib/utils/jeton";

/** Duree d'une session adherent, fixee par le §5. Un adherent ne retiendra
 *  pas un mot de passe et ne doit pas redemander un acces a chaque visite. */
export const JOURS_SESSION = 90;

/** Les statuts qui donnent droit a un espace.
 *
 *  EXPIRE et SUSPENDU sont volontairement inclus : c'est justement l'adherent
 *  dont l'abonnement est fini qui a le plus besoin de le voir ecrit.
 *  EN_ATTENTE_VALIDATION est exclu (§4) : tant que le staff n'a pas valide,
 *  cette personne n'est qu'une demande, pas un adherent.
 *  ARCHIVE est exclu : il ne franchit plus la porte. */
const STATUTS_AUTORISES: readonly string[] = ["ACTIF", "EXPIRE", "SUSPENDU"];

/* =========================================================================
   1. COTE STAFF — tenant resolu par la session Clerk, comme partout ailleurs
   ========================================================================= */

export class AdherentNonInvitableError extends Error {
  constructor(public readonly raison: "introuvable" | "statut") {
    super(
      raison === "introuvable"
        ? "Adherent introuvable"
        : "Cet adherent ne peut pas encore acceder a son espace",
    );
    this.name = "AdherentNonInvitableError";
  }
}

/**
 * Genere l'invitation nominative d'un adherent.
 *
 * /!\ Le jeton en clair renvoye ici est la SEULE occasion de le voir (§9) :
 * la base n'en garde que l'empreinte. Le staff le copie et le transmet
 * lui-meme. Au Lot 2, l'envoi WhatsApp partira d'ici — le modele ne changera
 * pas pour autant.
 *
 * Les invitations precedentes encore vivantes sont revoquees dans la meme
 * transaction : un seul lien valide a la fois, sinon un lien transmis par
 * erreur reste utilisable des mois.
 */
export async function creerInvitationAdherent(
  adherentId: string,
  jours: number = JOURS_VALIDITE_DEFAUT,
) {
  const { gymId, userId } = await getTenantContext();

  const { clair, hache } = genererJeton();

  const invitation = await prisma.$transaction(async (tx) => {
    // Le filtre gymId est ici la seule chose qui empeche une salle d'inviter
    // l'adherent d'une autre (§3). L'identifiant vient d'une URL : il n'a
    // aucune autorite par lui-meme.
    const adherent = await tx.adherent.findFirst({
      where: { gymId, id: adherentId },
      select: { statut: true },
    });

    if (!adherent) throw new AdherentNonInvitableError("introuvable");
    if (!STATUTS_AUTORISES.includes(adherent.statut)) {
      throw new AdherentNonInvitableError("statut");
    }

    await tx.invitation.updateMany({
      where: { gymId, adherentId, utiliseLe: null, revoqueLe: null },
      data: { revoqueLe: new Date() },
    });

    return tx.invitation.create({
      data: {
        gymId,
        adherentId,
        jetonHache: hache, // l'empreinte, jamais le clair
        expireLe: expirationDans(jours),
        creeParUserId: userId,
      },
    });
  });

  return { invitation, jetonClair: clair };
}

/**
 * L'etat de l'espace d'un adherent, tel qu'affiche sur sa fiche.
 *
 * Repond aux trois questions du gerant : lui a-t-on envoye un lien, s'en
 * est-il servi, et se connecte-t-il encore ?
 */
export async function etatEspaceAdherent(adherentId: string) {
  const { gymId } = await getTenantContext();
  const maintenant = new Date();

  const [invitation, sessions] = await Promise.all([
    // La derniere invitation, quelle qu'en soit l'issue : le staff doit voir
    // "expiree depuis 3 jours" aussi bien que "en attente".
    prisma.invitation.findFirst({
      where: { gymId, adherentId },
      orderBy: { creeLe: "desc" },
      select: {
        id: true,
        creeLe: true,
        expireLe: true,
        utiliseLe: true,
        revoqueLe: true,
      },
    }),
    prisma.sessionAdherent.findMany({
      where: {
        gymId,
        adherentId,
        revoqueLe: null,
        expireLe: { gt: maintenant },
      },
      orderBy: { dernierAccesLe: "desc" },
      select: { id: true, dernierAccesLe: true, creeLe: true },
    }),
  ]);

  const enAttente =
    invitation !== null &&
    invitation.utiliseLe === null &&
    invitation.revoqueLe === null &&
    invitation.expireLe > maintenant;

  return {
    invitation,
    /** Un lien est parti et n'a pas encore ete utilise. */
    enAttente,
    /** L'espace est reellement ouvert : au moins une session vivante. */
    actif: sessions.length > 0,
    nombreSessions: sessions.length,
    dernierAcces: sessions[0]?.dernierAccesLe ?? null,
  };
}

/** Revoque l'invitation en cours. Le lien deja transmis devient inutilisable. */
export async function revoquerInvitationAdherent(adherentId: string) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.invitation.updateMany({
    where: { gymId, adherentId, utiliseLe: null, revoqueLe: null },
    data: { revoqueLe: new Date() },
  });

  if (resultat.count === 0) throw new Error("Aucune invitation a revoquer");
}

/**
 * Ferme l'acces d'un adherent : toutes ses sessions, sur tous ses appareils.
 *
 * Le cas d'usage reel est le telephone perdu. On ne supprime pas les lignes,
 * on les date : le gerant doit pouvoir constater qu'un acces a bien ete coupe.
 */
export async function fermerSessionsAdherent(adherentId: string) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.sessionAdherent.updateMany({
    where: { gymId, adherentId, revoqueLe: null },
    data: { revoqueLe: new Date() },
  });

  return resultat.count;
}

/* =========================================================================
   2. COTE PUBLIC — aucune session Clerk. Le gymId sort du jeton, point.
   ========================================================================= */

export type RaisonInvitationInvalide =
  | "introuvable"
  | "expire"
  | "revoque"
  | "utilise"
  | "statut";

export type EtatInvitation =
  | {
      valide: true;
      adherentId: string;
      gymId: string;
      gymNom: string;
      prenom: string;
    }
  | { valide: false; raison: RaisonInvitationInvalide };

/**
 * Verifie un jeton d'invitation, SANS le consommer.
 *
 * Sert a afficher la page d'activation. La consommation est un acte separe et
 * volontaire (voir ouvrirSessionDepuisInvitation) : un lien a usage unique ne
 * doit pas etre brule par le simple chargement de la page — les apercus de
 * lien de WhatsApp visitent l'URL avant l'adherent.
 */
export async function verifierInvitation(
  jetonClair: string,
): Promise<EtatInvitation> {
  const invitation = await prisma.invitation.findUnique({
    where: { jetonHache: hacherJeton(jetonClair) },
    select: {
      gymId: true,
      adherentId: true,
      expireLe: true,
      utiliseLe: true,
      revoqueLe: true,
      gym: { select: { nom: true, actif: true } },
      adherent: { select: { prenom: true, statut: true } },
    },
  });

  // Un jeton inexact ne revele rien : ni l'existence d'une salle, ni celle
  // d'un adherent.
  if (!invitation || !invitation.gym.actif) {
    return { valide: false, raison: "introuvable" };
  }
  if (invitation.revoqueLe) return { valide: false, raison: "revoque" };
  if (invitation.utiliseLe) return { valide: false, raison: "utilise" };
  if (invitation.expireLe < new Date()) {
    return { valide: false, raison: "expire" };
  }
  if (!STATUTS_AUTORISES.includes(invitation.adherent.statut)) {
    return { valide: false, raison: "statut" };
  }

  return {
    valide: true,
    adherentId: invitation.adherentId,
    gymId: invitation.gymId,
    gymNom: invitation.gym.nom,
    prenom: invitation.adherent.prenom,
  };
}

export class InvitationInvalideError extends Error {
  constructor(public readonly raison: RaisonInvitationInvalide) {
    super("Ce lien n'est plus utilisable");
    this.name = "InvitationInvalideError";
  }
}

/**
 * Consomme l'invitation et ouvre une session de 90 jours.
 *
 * Retourne le jeton de session EN CLAIR : l'appelant le depose dans un cookie
 * httpOnly et ne le conserve nulle part ailleurs. La base n'en connait que
 * l'empreinte, exactement comme pour l'invitation.
 *
 * Tout se joue dans une transaction : la re-verification de l'invitation et
 * sa consommation. Sans cela, deux ouvertures simultanees du meme lien a
 * usage unique passeraient toutes les deux.
 */
export async function ouvrirSessionDepuisInvitation(jetonClair: string) {
  const empreinte = hacherJeton(jetonClair);
  const session = genererJeton();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { jetonHache: empreinte },
      select: {
        id: true,
        gymId: true,
        adherentId: true,
        expireLe: true,
        utiliseLe: true,
        revoqueLe: true,
        gym: { select: { actif: true } },
        adherent: { select: { statut: true } },
      },
    });

    // Re-verification COMPLETE dans la transaction : l'invitation a pu etre
    // revoquee entre l'affichage de la page et le clic.
    if (!invitation || !invitation.gym.actif) {
      throw new InvitationInvalideError("introuvable");
    }
    if (invitation.revoqueLe) throw new InvitationInvalideError("revoque");
    if (invitation.utiliseLe) throw new InvitationInvalideError("utilise");
    if (invitation.expireLe < new Date()) {
      throw new InvitationInvalideError("expire");
    }
    if (!STATUTS_AUTORISES.includes(invitation.adherent.statut)) {
      throw new InvitationInvalideError("statut");
    }

    // Usage unique (§4) : le updateMany avec utiliseLe: null est ce qui rend
    // la course perdante pour le second appel, meme si les deux transactions
    // ont lu l'invitation en meme temps.
    const consommee = await tx.invitation.updateMany({
      where: { id: invitation.id, utiliseLe: null },
      data: { utiliseLe: new Date() },
    });

    if (consommee.count === 0) throw new InvitationInvalideError("utilise");

    await tx.sessionAdherent.create({
      data: {
        gymId: invitation.gymId,
        adherentId: invitation.adherentId,
        jetonHache: session.hache,
        expireLe: expirationDans(JOURS_SESSION),
      },
    });

    return { jetonSession: session.clair, adherentId: invitation.adherentId };
  });
}

/* --- Lecture et fermeture d'une session ----------------------------------- */

/** Au-dela de ce delai, dernierAccesLe est rafraichi. Le mettre a jour a
 *  chaque requete ecrirait en base a chaque clic, pour une information dont
 *  la precision a la journee suffit largement. */
const RAFRAICHIR_ACCES_APRES_MS = 6 * 60 * 60 * 1000;

/**
 * Resout une session a partir du jeton du cookie.
 *
 * C'est le point d'entree unique du multi-tenant cote adherent : le gymId
 * renvoye ici vient de la base, jamais de l'URL ni d'un formulaire (§3, §9).
 */
export async function lireSessionAdherent(jetonClair: string) {
  const session = await prisma.sessionAdherent.findUnique({
    where: { jetonHache: hacherJeton(jetonClair) },
    select: {
      id: true,
      gymId: true,
      adherentId: true,
      expireLe: true,
      revoqueLe: true,
      dernierAccesLe: true,
      gym: { select: { id: true, nom: true, ville: true, actif: true } },
      adherent: {
        select: {
          id: true,
          numero: true,
          prenom: true,
          nom: true,
          telephone: true,
          photoUrl: true,
          statut: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revoqueLe) return null;
  if (session.expireLe < new Date()) return null;
  if (!session.gym.actif) return null;
  // Le statut est reverifie a CHAQUE requete, pas seulement a l'ouverture :
  // un adherent archive apres coup perd son acces sans que personne ait a
  // penser a fermer sa session.
  if (!STATUTS_AUTORISES.includes(session.adherent.statut)) return null;

  const maintenant = Date.now();
  if (
    maintenant - session.dernierAccesLe.getTime() >
    RAFRAICHIR_ACCES_APRES_MS
  ) {
    // Volontairement non bloquant : cette mise a jour est du confort pour le
    // gerant, elle ne doit jamais empecher l'adherent de voir sa page.
    prisma.sessionAdherent
      .update({
        where: { id: session.id },
        data: { dernierAccesLe: new Date() },
      })
      .catch(() => {});
  }

  return session;
}

/** Deconnexion : la session est datee, pas supprimee. */
export async function fermerSession(jetonClair: string) {
  await prisma.sessionAdherent.updateMany({
    where: { jetonHache: hacherJeton(jetonClair), revoqueLe: null },
    data: { revoqueLe: new Date() },
  });
}
