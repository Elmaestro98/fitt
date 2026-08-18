"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
  creerLienInscription,
  inscrireViaLien,
  LienInvalideError,
  revoquerLien,
  schemaNouveauLien,
  schemaPreinscription,
  TelephoneDejaInscritError,
} from "@/lib/data/invitation";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  succes?: boolean;
  /** Le jeton en clair, visible UNE SEULE FOIS (§9). */
  lien?: string;
};

function nettoyer(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && valeur.trim() !== "") objet[cle] = valeur;
  }
  return objet;
}

/**
 * Origine du site telle que le navigateur l'a vue.
 *
 * Deduite des en-tetes plutot que d'une variable d'environnement : le lien
 * fonctionne ainsi en local (localhost:3001), sur une preview Vercel et en
 * production, sans configuration. NEXT_PUBLIC_APP_URL reste prioritaire si
 * elle est definie, pour le cas d'un nom de domaine personnalise.
 */
async function origineRequete() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const enTetes = await headers();
  const hote = enTetes.get("x-forwarded-host") ?? enTetes.get("host") ?? "";
  const protocole =
    enTetes.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") ? "http" : "https");

  return `${protocole}://${hote}`;
}

/* --- Cote staff ----------------------------------------------------------- */

export async function actionCreerLien(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaNouveauLien.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    const { jetonClair } = await creerLienInscription(resultat.data);
    revalidatePath("/adherents/invitations");

    // L'URL complete est assemblee ici, cote serveur. Le jeton n'a jamais
    // ete stocke : c'est le seul passage de tout le code ou il existe en
    // clair.
    return {
      succes: true,
      lien: `${await origineRequete()}/rejoindre/${jetonClair}`,
    };
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "La creation du lien a echoue. Reessayez.",
    };
  }
}

export async function actionRevoquerLien(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await revoquerLien(id);
  } catch {
    // Un lien deja revoque n'est pas une erreur a remonter : l'ecran affiche
    // simplement l'etat courant apres rechargement.
  }

  revalidatePath("/adherents/invitations");
}

/* --- Cote public ---------------------------------------------------------- */

export type EtatPreinscription = EtatFormulaire & {
  /** Numero attribue, affiche sur l'ecran de confirmation. */
  numero?: string;
  prenom?: string;
  /** Le lien lui-meme n'est plus utilisable : inutile de reproposer le formulaire. */
  lienMort?: boolean;
};

/**
 * Envoi du formulaire public de pre-inscription.
 *
 * Le jeton arrive par .bind cote serveur, depuis le segment d'URL. Aucun
 * gymId ne transite par le formulaire (§9) : inscrireViaLien le deduit du
 * jeton, dans la transaction.
 */
export async function actionPreinscription(
  jeton: string,
  _precedent: EtatPreinscription,
  formData: FormData,
): Promise<EtatPreinscription> {
  const resultat = schemaPreinscription.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    const adherent = await inscrireViaLien(jeton, resultat.data);

    // La salle voit arriver la demande immediatement.
    revalidatePath("/adherents");
    revalidatePath("/adherents/invitations");

    return {
      succes: true,
      numero: adherent.numero,
      prenom: adherent.prenom,
    };
  } catch (erreur) {
    if (erreur instanceof TelephoneDejaInscritError) {
      return {
        erreurs: {
          telephone: [
            "Ce numero est deja enregistre. Presentez-vous a l'accueil.",
          ],
        },
      };
    }

    if (erreur instanceof LienInvalideError) {
      return {
        lienMort: true,
        message:
          "Ce lien n'est plus utilisable. Demandez-en un nouveau a la salle.",
      };
    }

    return {
      message: "L'envoi a echoue. Verifiez votre connexion et reessayez.",
    };
  }
}
