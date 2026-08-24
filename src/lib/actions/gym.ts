"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  modifierParametresSalle,
  renouvelerCodeSeance,
  schemaParametresSalle,
  type IntentionLogoGym,
} from "@/lib/data/gym";
import { PhotoInvalideError } from "@/lib/data/stockage";
import { messageErreur } from "@/lib/utils/erreurs";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  succes?: boolean;
};

/* Les champs vides sont conserves ici, contrairement aux autres formulaires
   du projet : vider l'adresse doit effacer l'adresse. Ailleurs on nettoie les
   chaines vides parce qu'un champ absent signifie "ne pas changer" ; sur un
   ecran de parametres, il signifie "supprimer". */
function lire(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string") objet[cle] = valeur;
  }
  return objet;
}

/** Meme logique que lireIntentionPhoto dans lib/actions/produit.ts et
 *  lib/actions/adherent.ts : un <input type="file"> non renseigne arrive
 *  comme un File de taille 0, jamais comme un champ absent. */
function lireIntentionLogo(formData: FormData): IntentionLogoGym {
  const fichier = formData.get("logo");
  if (fichier instanceof File && fichier.size > 0) {
    return { action: "remplacee", fichier };
  }
  if (formData.get("retirerLogo") === "on") {
    return { action: "retiree" };
  }
  return { action: "inchangee" };
}

export async function actionModifierParametres(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaParametresSalle.safeParse(lire(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierParametresSalle(resultat.data, lireIntentionLogo(formData));
  } catch (erreur) {
    if (erreur instanceof PhotoInvalideError) {
      return { erreurs: { logo: [erreur.message] } };
    }
    return {
      message: messageErreur(erreur, "L'enregistrement a echoue. Reessayez."),
    };
  }

  revalidatePath("/parametres");
  // Le nom, les coordonnees et le logo de la salle s'affichent aussi
  // ailleurs.
  revalidatePath("/tableau-de-bord");
  revalidatePath("/adherents/[id]/carte", "page");

  return { succes: true };
}

/**
 * Tire un nouveau code de seance immediatement.
 *
 * Le cas d'usage est concret : le code a ete photographie et circule dans un
 * groupe WhatsApp. Le gerant le change, et les absents ne peuvent plus pointer
 * a distance.
 */
export async function actionRenouvelerCodeSeance(): Promise<{
  code?: string;
  message?: string;
}> {
  try {
    const code = await renouvelerCodeSeance();
    revalidatePath("/pointage");
    return { code };
  } catch (erreur) {
    return {
      message: messageErreur(erreur, "Le changement de code a echoue. Reessayez."),
    };
  }
}
