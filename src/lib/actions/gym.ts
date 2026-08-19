"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  modifierParametresSalle,
  renouvelerCodeSeance,
  schemaParametresSalle,
} from "@/lib/data/gym";

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

export async function actionModifierParametres(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaParametresSalle.safeParse(lire(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierParametresSalle(resultat.data);
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "L'enregistrement a echoue. Reessayez.",
    };
  }

  revalidatePath("/parametres");
  // Le nom et les coordonnees de la salle s'affichent aussi ailleurs.
  revalidatePath("/tableau-de-bord");

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
      message:
        erreur instanceof Error
          ? erreur.message
          : "Le changement de code a echoue. Reessayez.",
    };
  }
}
