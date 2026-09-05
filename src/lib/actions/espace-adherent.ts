"use server";

// Server Actions de l'espace adherent (CLAUDE.md §7 : mutations par Server
// Actions, jamais par des routes API).
//
// Deux publics dans ce fichier, comme dans lib/data/espace-adherent.ts :
//   - le staff, qui invite, revoque et coupe des acces ;
//   - l'adherent lui-meme, qui active son espace et s'en deconnecte.
//
// Aucune de ces actions ne recoit de gymId : celui du staff sort de Clerk,
// celui de l'adherent sort du jeton. Un gymId dans un formulaire serait un
// vecteur direct de fuite inter-tenant (§9).
import { revalidatePath } from "next/cache";
import { origineRequete } from "@/lib/utils/url";
import {
  AdherentNonInvitableError,
  creerInvitationAdherent,
  fermerSessionsAdherent,
  InvitationInvalideError,
  ouvrirSessionDepuisInvitation,
  revoquerInvitationAdherent,
  type RaisonInvitationInvalide,
} from "@/lib/data/espace-adherent";
import {
  deposerCookieSession,
  supprimerCookieSession,
} from "@/lib/session-adherent";

export type EtatInvitationAdherent = {
  message?: string;
  succes?: boolean;
  /** Le lien en clair, visible UNE SEULE FOIS (§9). */
  lien?: string;
};


/* --- Cote staff ----------------------------------------------------------- */

/**
 * Invite un adherent a activer son espace.
 *
 * /!\ Le lien renvoye est la seule occasion de le voir. Il part directement
 * dans WhatsApp avec un message pre-rempli (CarteEspace) — le staff n'a plus
 * qu'a relire et envoyer.
 */
export async function actionInviterAdherent(
  adherentId: string,
): Promise<EtatInvitationAdherent> {
  try {
    const { jetonClair } = await creerInvitationAdherent(adherentId);

    revalidatePath(`/adherents/${adherentId}`);

    // L'URL complete est assemblee ici, cote serveur : c'est le seul endroit
    // du code ou le jeton existe en clair.
    const origine = await origineRequete();
    return {
      succes: true,
      lien: `${origine}/activer/${encodeURIComponent(jetonClair)}`,
    };
  } catch (erreur) {
    if (erreur instanceof AdherentNonInvitableError) {
      return { message: erreur.message };
    }
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "La generation du lien a echoue. Reessayez.",
    };
  }
}

/** Annule une invitation envoyee par erreur. */
export async function actionRevoquerInvitation(
  adherentId: string,
): Promise<EtatInvitationAdherent> {
  try {
    await revoquerInvitationAdherent(adherentId);
    revalidatePath(`/adherents/${adherentId}`);
    return { succes: true };
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error ? erreur.message : "La revocation a echoue.",
    };
  }
}

/**
 * Ferme l'acces de l'adherent sur tous ses appareils.
 *
 * Le cas reel est le telephone perdu ou vole. Effet immediat : la prochaine
 * page demandee affichera l'ecran de reconnexion.
 */
export async function actionFermerAcces(
  adherentId: string,
): Promise<EtatInvitationAdherent> {
  try {
    const fermees = await fermerSessionsAdherent(adherentId);
    revalidatePath(`/adherents/${adherentId}`);

    if (fermees === 0) return { message: "Aucun acces ouvert a fermer." };
    return { succes: true };
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error ? erreur.message : "La fermeture a echoue.",
    };
  }
}

/* --- Cote adherent -------------------------------------------------------- */

export type EtatActivation = {
  succes?: boolean;
  raison?: RaisonInvitationInvalide;
  message?: string;
};

/**
 * Active l'espace : consomme l'invitation et depose le cookie de session.
 *
 * /!\ C'est une Server Action, donc un POST declenche par un clic, et pas le
 * chargement de la page. Deux raisons, toutes deux vecues :
 *   - le lien est a usage unique (§4) ; l'apercu de lien que WhatsApp genere
 *     visite l'URL avant l'adherent et brulerait le jeton ;
 *   - Next.js interdit d'ecrire un cookie pendant le rendu d'une page.
 */
export async function actionActiverEspace(
  jetonClair: string,
): Promise<EtatActivation> {
  try {
    const { jetonSession } = await ouvrirSessionDepuisInvitation(jetonClair);
    await deposerCookieSession(jetonSession);
    return { succes: true };
  } catch (erreur) {
    if (erreur instanceof InvitationInvalideError) {
      return { raison: erreur.raison, message: erreur.message };
    }
    return {
      message: "L'activation a echoue. Verifiez votre connexion et reessayez.",
    };
  }
}

/** Deconnexion de l'espace adherent. La session est fermee en base aussi. */
export async function actionDeconnecterAdherent() {
  await supprimerCookieSession();
}
