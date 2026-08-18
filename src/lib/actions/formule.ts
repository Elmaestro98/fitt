"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  basculerArchivageFormule,
  creerFormule,
  modifierFormule,
  schemaFormule,
} from "@/lib/data/formule";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
};

function estDoublon(e: unknown): e is { code: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  );
}

function nettoyer(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && valeur.trim() !== "") objet[cle] = valeur;
  }
  return objet;
}

export async function actionCreerFormule(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaFormule.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await creerFormule(resultat.data);
  } catch (erreur) {
    if (estDoublon(erreur)) {
      return { erreurs: { nom: ["Une formule porte deja ce nom."] } };
    }
    return { message: "L'enregistrement a echoue. Reessayez." };
  }

  revalidatePath("/formules");
  redirect("/formules");
}

export async function actionModifierFormule(
  id: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaFormule.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierFormule(id, resultat.data);
  } catch (erreur) {
    if (estDoublon(erreur)) {
      return { erreurs: { nom: ["Une autre formule porte deja ce nom."] } };
    }
    return { message: "La modification a echoue. Reessayez." };
  }

  revalidatePath("/formules");
  redirect("/formules");
}

/* Archivage — il n'existe aucune action de suppression, et c'est volontaire
   (§9 : archiver seulement, sinon l'historique devient illisible). */
export async function actionBasculerArchivage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "true";
  if (!id) return;

  await basculerArchivageFormule(id, actif);
  revalidatePath("/formules");
}
