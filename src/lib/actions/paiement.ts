"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  annulerPaiement,
  enregistrerPaiement,
  schemaPaiement,
} from "@/lib/data/paiement";

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

/* Toutes les vues qui affichent un montant encaisse. Un paiement change le
   solde de l'adherent, la recette du jour et le chiffre du tableau de bord :
   les trois doivent etre rafraichies ensemble. */
function revaliderVues(adherentId: string | null) {
  revalidatePath("/paiements");
  revalidatePath("/adherents");
  if (adherentId) revalidatePath(`/adherents/${adherentId}`);
  revalidatePath("/tableau-de-bord");
}

export async function actionEnregistrerPaiement(
  adherentId: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaPaiement.safeParse(nettoyer(formData));
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    // L'adherentId vient de .bind cote serveur, jamais du formulaire.
    // enregistrerPaiement revalide malgre tout son appartenance a la salle.
    await enregistrerPaiement(adherentId, resultat.data);
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "L'enregistrement a echoue. Reessayez.",
    };
  }

  revaliderVues(adherentId);
  return { succes: true };
}

const schemaAnnulation = z.object({
  motif: z
    .string()
    .trim()
    .min(5, "Indiquez un motif d'au moins 5 caracteres"),
});

/**
 * Annulation d'un encaissement.
 *
 * Rien n'est supprime ni corrige (§9) : annulerPaiement ecrit une ligne de
 * contrepartie. Le motif est obligatoire — c'est lui qui explique, dans six
 * mois, pourquoi la recette de ce jour-la a bouge.
 */
export async function actionAnnulerPaiement(
  adherentId: string | null,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const id = String(formData.get("paiementId") ?? "");
  const resultat = schemaAnnulation.safeParse(nettoyer(formData));

  if (!id) return { message: "Paiement introuvable." };
  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await annulerPaiement(id, resultat.data.motif);
  } catch (erreur) {
    return {
      message:
        erreur instanceof Error
          ? erreur.message
          : "L'annulation a echoue. Reessayez.",
    };
  }

  revaliderVues(adherentId);
  return { succes: true };
}
