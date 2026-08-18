"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  annulerAbonnement,
  schemaSouscription,
  souscrireAbonnement,
} from "@/lib/data/abonnement";

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

export async function actionSouscrire(
  adherentId: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaSouscription.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    // L'adherentId vient de .bind cote serveur, jamais du formulaire.
    // souscrireAbonnement revalide malgre tout son appartenance a la salle.
    await souscrireAbonnement(adherentId, resultat.data);
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "La souscription a echoue. Reessayez.",
    };
  }

  revalidatePath("/adherents");
  revalidatePath(`/adherents/${adherentId}`);
  revalidatePath("/abonnements");
  revalidatePath("/tableau-de-bord");

  redirect(`/adherents/${adherentId}`);
}

const schemaAnnulation = z.object({
  motif: z
    .string()
    .trim()
    .min(5, "Indiquez un motif d'au moins 5 caracteres"),
});

/* Annuler exige un motif : sans lui, personne ne saura dans six mois pourquoi
   cet abonnement a disparu du chiffre d'affaires (§9).

   adherentId sert uniquement a revalider la bonne fiche. Il n'entre jamais
   dans la requete : annulerAbonnement retrouve l'abonnement par son id ET le
   gymId de la session. */
export async function actionAnnulerAbonnement(
  adherentId: string | null,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const id = String(formData.get("abonnementId") ?? "");
  const resultat = schemaAnnulation.safeParse(nettoyer(formData));

  if (!id) return { message: "Abonnement introuvable." };
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await annulerAbonnement(id, resultat.data.motif);
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "L'annulation a echoue. Reessayez.",
    };
  }

  revalidatePath("/adherents");
  if (adherentId) revalidatePath(`/adherents/${adherentId}`);
  revalidatePath("/abonnements");
  revalidatePath("/tableau-de-bord");

  return { succes: true };
}
