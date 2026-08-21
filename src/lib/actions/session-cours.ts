"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  annulerSessionCours,
  creerSessionCours,
  modifierSessionCours,
  schemaAnnulationSession,
  schemaSessionCours,
} from "@/lib/data/session-cours";
import { messageErreur } from "@/lib/utils/erreurs";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  succes?: boolean;
};

function nettoyer(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && valeur.trim() !== "") objet[cle] = valeur;
  }
  return objet;
}

export async function actionCreerSessionCours(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaSessionCours.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await creerSessionCours(resultat.data);
  } catch (erreur) {
    return {
      message: messageErreur(erreur, "L'enregistrement a echoue. Reessayez."),
    };
  }

  revalidatePath("/cours");
  redirect("/cours");
}

export async function actionModifierSessionCours(
  sessionCoursId: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaSessionCours.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierSessionCours(sessionCoursId, resultat.data);
  } catch (erreur) {
    return {
      message: messageErreur(erreur, "La modification a echoue. Reessayez."),
    };
  }

  revalidatePath("/cours");
  revalidatePath(`/cours/${sessionCoursId}`);
  redirect(`/cours/${sessionCoursId}`);
}

/* Annuler exige un motif (§9) : sans lui, personne ne saura dans six mois
   pourquoi cette seance a disparu du planning. */
export async function actionAnnulerSession(
  sessionCoursId: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaAnnulationSession.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await annulerSessionCours(sessionCoursId, resultat.data.motif);
  } catch (erreur) {
    return {
      message: messageErreur(erreur, "L'annulation a echoue. Reessayez."),
    };
  }

  revalidatePath("/cours");
  revalidatePath(`/cours/${sessionCoursId}`);
  return { succes: true };
}
