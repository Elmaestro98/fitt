"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  enregistrerPointages,
  schemaLotPointages,
  type EntreePointage,
} from "@/lib/data/pointage";

export type ResultatSynchro = {
  /** Cles que la borne peut retirer de sa file locale. */
  cles: string[];
  enregistres: number;
  ignores: number;
  message?: string;
};

/**
 * Envoie un lot de passages au serveur.
 *
 * Cette action est appelee dans deux situations : a chaque passage quand tout
 * va bien, et en rattrapage au retour du reseau. Elle est ecrite pour la
 * seconde — idempotente, et tolerante a un lot deja enregistre.
 *
 * En cas d'echec, elle ne renvoie AUCUNE cle : la borne garde alors tout dans
 * sa file et reessaiera. C'est la traduction du §9 — un passage ne se perd
 * pas, meme si le serveur est injoignable.
 */
export async function actionPointer(
  entrees: unknown,
): Promise<ResultatSynchro> {
  const resultat = schemaLotPointages.safeParse(entrees);

  if (!resultat.success) {
    return {
      cles: [],
      enregistres: 0,
      ignores: 0,
      message: z.prettifyError(resultat.error),
    };
  }

  try {
    const bilan = await enregistrerPointages(
      resultat.data as EntreePointage[],
    );

    revalidatePath("/pointage");
    revalidatePath("/tableau-de-bord");

    return {
      cles: bilan.cles,
      enregistres: bilan.enregistres,
      ignores: bilan.ignores,
    };
  } catch (erreur) {
    return {
      cles: [],
      enregistres: 0,
      ignores: 0,
      message:
        erreur instanceof Error
          ? erreur.message
          : "Le serveur est injoignable. Les passages restent en attente.",
    };
  }
}
