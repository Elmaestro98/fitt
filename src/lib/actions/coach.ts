"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  basculerArchivageCoach,
  creerCoach,
  modifierCoach,
  schemaCoach,
} from "@/lib/data/coach";

export type EtatFormulaire = {
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

export async function actionCreerCoach(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaCoach.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await creerCoach(resultat.data);
  } catch {
    return { message: "L'enregistrement a echoue. Reessayez." };
  }

  revalidatePath("/cours/coachs");
  redirect("/cours/coachs");
}

export async function actionModifierCoach(
  id: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaCoach.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierCoach(id, resultat.data);
  } catch {
    return { message: "La modification a echoue. Reessayez." };
  }

  revalidatePath("/cours/coachs");
  redirect("/cours/coachs");
}

/* Archivage — il n'existe aucune action de suppression, et c'est volontaire
   (§9 : archiver seulement, sinon l'historique devient illisible). */
export async function actionBasculerArchivageCoach(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "true";
  if (!id) return;

  await basculerArchivageCoach(id, actif);
  revalidatePath("/cours/coachs");
}
