"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  basculerArchivageTypeCours,
  creerTypeCours,
  modifierTypeCours,
  schemaTypeCours,
} from "@/lib/data/type-cours";

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

export async function actionCreerTypeCours(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaTypeCours.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await creerTypeCours(resultat.data);
  } catch (erreur) {
    if (estDoublon(erreur)) {
      return { erreurs: { nom: ["Un type de cours porte deja ce nom."] } };
    }
    return { message: "L'enregistrement a echoue. Reessayez." };
  }

  revalidatePath("/cours/types-cours");
  redirect("/cours/types-cours");
}

export async function actionModifierTypeCours(
  id: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaTypeCours.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierTypeCours(id, resultat.data);
  } catch (erreur) {
    if (estDoublon(erreur)) {
      return { erreurs: { nom: ["Un autre type de cours porte deja ce nom."] } };
    }
    return { message: "La modification a echoue. Reessayez." };
  }

  revalidatePath("/cours/types-cours");
  redirect("/cours/types-cours");
}

/* Archivage — il n'existe aucune action de suppression, et c'est volontaire
   (§9 : archiver seulement, sinon l'historique devient illisible). */
export async function actionBasculerArchivageTypeCours(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "true";
  if (!id) return;

  await basculerArchivageTypeCours(id, actif);
  revalidatePath("/cours/types-cours");
}
