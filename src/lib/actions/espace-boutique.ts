"use server";

// Commandes passees depuis l'espace adherent.
//
// Fichier separe de actions/produit.ts, qui appartient au back-office : celui-
// la tourne sous session Clerk et gere le catalogue, celui-ci tourne sous
// session adherent et gere les commandes (§5).
import { revalidatePath } from "next/cache";
import {
  annulerMaCommande,
  passerCommande,
  schemaPanier,
  type ResultatCommande,
} from "@/lib/data/espace-boutique";

export type EtatCommande = {
  succes?: boolean;
  message?: string;
};

/** /!\ redirect() signale une redirection en LANCANT une erreur. Sans ce
 *  test, le catch avalerait la redirection vers l'ecran d'acces d'un adherent
 *  dont la session vient d'expirer — meme piege que dans espace-pointage.ts. */
function estRedirection(erreur: unknown): boolean {
  return (
    erreur instanceof Error &&
    "digest" in erreur &&
    typeof erreur.digest === "string" &&
    erreur.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function actionPasserCommande(
  panierJSON: string,
): Promise<EtatCommande> {
  let brut: unknown;
  try {
    brut = JSON.parse(panierJSON);
  } catch {
    return { message: "Votre panier n'a pas pu etre lu. Rechargez la page." };
  }

  const panier = schemaPanier.safeParse(brut);
  if (!panier.success) {
    return {
      message: panier.error.issues[0]?.message ?? "Votre panier est invalide.",
    };
  }

  let resultat: ResultatCommande;
  try {
    resultat = await passerCommande(panier.data);
  } catch (erreur) {
    if (estRedirection(erreur)) throw erreur;
    return {
      message:
        "Impossible de joindre la salle. Reessayez, ou passez directement a l'accueil.",
    };
  }

  if (!resultat.ok) {
    return {
      message:
        resultat.raison === "panier-vide"
          ? "Votre panier est vide."
          : "Un article de votre panier n'est plus disponible. Rechargez la page.",
    };
  }

  revalidatePath("/espace/boutique");
  revalidatePath("/espace/commandes");

  return { succes: true };
}

export async function actionAnnulerMaCommande(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await annulerMaCommande(id);
  revalidatePath("/espace/commandes");
}
