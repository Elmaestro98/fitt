"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  basculerArchivageProduit,
  creerProduit,
  modifierProduit,
  schemaProduit,
  type IntentionPhoto,
} from "@/lib/data/produit";
import { PhotoInvalideError } from "@/lib/data/stockage";

export type EtatFormulaireProduit = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
};

function nettoyer(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && valeur.trim() !== "") objet[cle] = valeur;
  }
  return objet;
}

/**
 * Ce que le formulaire demande de faire de la photo.
 *
 * Un input file non renseigne arrive comme un File de taille 0 : c'est ce
 * cas-la, et pas l'absence du champ, qui signifie "je n'y touche pas".
 */
function lireIntentionPhoto(formData: FormData): IntentionPhoto {
  const fichier = formData.get("photo");
  if (fichier instanceof File && fichier.size > 0) {
    return { action: "remplacee", fichier };
  }
  if (formData.get("retirerPhoto") === "on") {
    return { action: "retiree" };
  }
  return { action: "inchangee" };
}

export async function actionCreerProduit(
  _precedent: EtatFormulaireProduit,
  formData: FormData,
): Promise<EtatFormulaireProduit> {
  const resultat = schemaProduit.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await creerProduit(resultat.data, lireIntentionPhoto(formData));
  } catch (erreur) {
    // Message precis sur la photo (format, taille), generique sinon : le
    // gerant doit savoir quoi corriger.
    if (erreur instanceof PhotoInvalideError) {
      return { erreurs: { photo: [erreur.message] } };
    }
    return { message: "L'enregistrement a echoue. Reessayez." };
  }

  revalidatePath("/boutique");
  revalidatePath("/espace/boutique");
  redirect("/boutique");
}

export async function actionModifierProduit(
  id: string,
  _precedent: EtatFormulaireProduit,
  formData: FormData,
): Promise<EtatFormulaireProduit> {
  const resultat = schemaProduit.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierProduit(id, resultat.data, lireIntentionPhoto(formData));
  } catch (erreur) {
    if (erreur instanceof PhotoInvalideError) {
      return { erreurs: { photo: [erreur.message] } };
    }
    return { message: "La modification a echoue. Reessayez." };
  }

  revalidatePath("/boutique");
  revalidatePath("/espace/boutique");
  redirect("/boutique");
}

/* Archivage — il n'existe aucune action de suppression, et c'est volontaire
   (§9 : archiver seulement, sinon l'historique des commandes devient
   illisible). */
export async function actionBasculerArchivageProduit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "true";
  if (!id) return;

  await basculerArchivageProduit(id, actif);
  revalidatePath("/boutique");
  revalidatePath("/espace/boutique");
}
