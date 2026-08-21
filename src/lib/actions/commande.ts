"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  annulerCommande,
  marquerCommandePrete,
  remettreCommande,
  schemaRemise,
} from "@/lib/data/commande";

export type EtatCommandeStaff = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
  succes?: string;
};

/** Toutes les vues touchees par une transition de commande. Le journal de
 *  caisse en fait partie : une remise y ecrit une ligne. */
function revaliderVuesCommande() {
  revalidatePath("/commandes");
  revalidatePath("/paiements");
  revalidatePath("/espace/commandes");
}

export async function actionMarquerPrete(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await marquerCommandePrete(id);
  revaliderVuesCommande();
}

export async function actionRemettreCommande(
  id: string,
  _precedent: EtatCommandeStaff,
  formData: FormData,
): Promise<EtatCommandeStaff> {
  const resultat = schemaRemise.safeParse({
    methode: formData.get("methode"),
    reference: formData.get("reference") || undefined,
  });

  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  let remise;
  try {
    remise = await remettreCommande(id, resultat.data);
  } catch {
    return { message: "L'encaissement a echoue. Reessayez." };
  }

  if (!remise.ok) {
    return {
      message:
        remise.raison === "introuvable"
          ? "Cette commande est introuvable."
          : "Cette commande a deja ete traitee — rechargez la page.",
    };
  }

  revaliderVuesCommande();
  return { succes: "Commande remise et encaissee." };
}

const schemaAnnulation = z.object({
  // Motif obligatoire : une commande annulee sans raison est une commande
  // qu'on ne saura pas expliquer a l'adherent qui la reclame (§9).
  motif: z
    .string()
    .trim()
    .min(3, "Indiquez la raison de l'annulation")
    .max(200),
});

export async function actionAnnulerCommande(
  id: string,
  _precedent: EtatCommandeStaff,
  formData: FormData,
): Promise<EtatCommandeStaff> {
  const resultat = schemaAnnulation.safeParse({
    motif: formData.get("motif"),
  });

  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  const annulee = await annulerCommande(id, resultat.data.motif);
  if (!annulee) {
    return {
      message: "Cette commande a deja ete traitee — rechargez la page.",
    };
  }

  revaliderVuesCommande();
  return { succes: "Commande annulee." };
}
