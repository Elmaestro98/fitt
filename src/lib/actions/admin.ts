"use server";

// Server Actions du Super Admin. Fichier separe de actions/gym.ts,
// volontairement : celui-ci est scope a une seule salle (getTenantContext),
// celui-la n'en connait aucune (getSuperAdminContext). Les melanger rendrait
// facile d'appeler la mauvaise fonction depuis le mauvais ecran.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  accorderEssai,
  activerSalleParEmail,
  basculerActivationSalle,
  definirAbonnementSalle,
  retirerEssai,
} from "@/lib/data/gym";
import { messageErreur } from "@/lib/utils/erreurs";

export type EtatActivationEmail = {
  erreur?: string;
  succes?: string;
};

const schemaEmail = z.email("Adresse e-mail invalide");

export async function actionActiverSalleParEmail(
  _precedent: EtatActivationEmail,
  formData: FormData,
): Promise<EtatActivationEmail> {
  const resultat = schemaEmail.safeParse(String(formData.get("email") ?? ""));
  if (!resultat.success) {
    return { erreur: "Adresse e-mail invalide" };
  }

  try {
    const { salle, creee } = await activerSalleParEmail(resultat.data);
    revalidatePath("/admin");
    // On distingue les deux cas : "creee" signale au Super Admin que cette
    // salle n'existait pas encore dans Fitt, et qu'il vient donc de
    // l'enregistrer en plus de lui ouvrir l'acces.
    return {
      succes: creee
        ? `${salle.nom} enregistree et activee`
        : `${salle.nom} activee`,
    };
  } catch (erreur) {
    return { erreur: messageErreur(erreur, "Activation echouee") };
  }
}

export async function actionBasculerActivationSalle(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const actif = formData.get("actif") === "true";
  if (!id) return;

  try {
    await basculerActivationSalle(id, actif);
  } catch (erreur) {
    // Aucun etat de formulaire ici (bouton simple, pas de champ) : une
    // erreur reste silencieuse pour l'utilisateur plutot que de faire
    // planter la page. Le compteur de salles actives ne bougera simplement
    // pas, ce qui est deja un signal suffisant sur cet ecran interne.
    console.error(messageErreur(erreur, "Bascule d'activation echouee"));
    return;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

/* --- Essai et abonnement ---------------------------------------------------
   Toutes revalident /admin ET la fiche de la salle : les deux ecrans
   affichent le meme statut, ils ne doivent jamais se contredire. */

function revaliderVuesSalle(id: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function actionAccorderEssai(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const jours = Number(formData.get("jours"));
  if (!id || !Number.isFinite(jours)) return;

  try {
    await accorderEssai(id, jours);
  } catch (erreur) {
    // Pas de retour d'etat : ce sont des boutons a duree fixe (+14, +30),
    // donc la seule erreur possible est une salle disparue entre-temps.
    console.error(messageErreur(erreur, "Essai non accorde"));
  }

  revaliderVuesSalle(id);
}

export async function actionDefinirAbonnement(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const abonnee = formData.get("abonnee") === "true";
  if (!id) return;

  try {
    await definirAbonnementSalle(id, abonnee);
  } catch (erreur) {
    console.error(messageErreur(erreur, "Changement d'abonnement echoue"));
  }

  revaliderVuesSalle(id);
}

export async function actionRetirerEssai(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  try {
    await retirerEssai(id);
  } catch (erreur) {
    console.error(messageErreur(erreur, "Retrait de l'essai echoue"));
  }

  revaliderVuesSalle(id);
}
