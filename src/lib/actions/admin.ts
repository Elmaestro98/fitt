"use server";

// Server Actions du Super Admin. Fichier separe de actions/gym.ts,
// volontairement : celui-ci est scope a une seule salle (getTenantContext),
// celui-la n'en connait aucune (getSuperAdminContext). Les melanger rendrait
// facile d'appeler la mauvaise fonction depuis le mauvais ecran.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { activerSalleParEmail, basculerActivationSalle } from "@/lib/data/gym";
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
