"use server";

// Auto-pointage depuis l'espace adherent.
//
// Fichier separe de actions/pointage.ts, qui appartient a la borne : celui-la
// recoit des LOTS venus d'une file locale et tourne sous session Clerk, celui-
// ci recoit un code a 4 chiffres et tourne sous session adherent. Les
// melanger obligerait a distinguer deux populations dans chaque fonction (§5).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  pointerDepuisEspace,
  type ResultatAutoPointage,
} from "@/lib/data/espace";

/* Le code est court et saisi au pouce : on accepte les espaces et les tirets,
   on refuse tout le reste avant meme de toucher a la base. */
const schemaCode = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 4, "Le code comporte 4 chiffres");

export type EtatPointageEspace = {
  succes?: boolean;
  deja?: boolean;
  message?: string;
};

export async function actionPointerEspace(
  code: string,
): Promise<EtatPointageEspace> {
  const saisie = schemaCode.safeParse(code);
  if (!saisie.success) {
    return { message: "Le code comporte 4 chiffres." };
  }

  let resultat: ResultatAutoPointage;
  try {
    resultat = await pointerDepuisEspace(saisie.data);
  } catch (erreur) {
    // /!\ redirect() signale une redirection en LANCANT une erreur. Sans ce
    // relais, le catch ci-dessous l'avalerait : un adherent dont la session a
    // expire verrait "impossible de joindre la salle" au lieu d'etre renvoye
    // vers l'ecran d'acces.
    if (
      erreur instanceof Error &&
      "digest" in erreur &&
      typeof erreur.digest === "string" &&
      erreur.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw erreur;
    }

    // Reseau coupe ou serveur injoignable : on ne pretend pas avoir
    // enregistre. L'adherent peut aussi passer a l'accueil (§9 — la salle
    // reste ouverte quoi qu'il arrive).
    return {
      message:
        "Impossible de joindre la salle. Reessayez, ou signalez-vous a l'accueil.",
    };
  }

  if (!resultat.ok) {
    return {
      message:
        resultat.raison === "aucun-code"
          ? "Aucun code n'est affiche a l'accueil aujourd'hui. Demandez a votre salle."
          : "Ce code ne correspond pas a celui affiche a l'accueil.",
    };
  }

  revalidatePath("/espace");
  revalidatePath("/espace/seances");

  return { succes: true, deja: resultat.deja };
}
