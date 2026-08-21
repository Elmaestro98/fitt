"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  annulerReservation,
  reserverPlace,
  schemaReservation,
} from "@/lib/data/reservation";
import { messageErreur } from "@/lib/utils/erreurs";

export async function actionReserverPlace(formData: FormData) {
  const sessionCoursId = String(formData.get("sessionCoursId") ?? "");
  const recherche = String(formData.get("recherche") ?? "");

  const resultat = schemaReservation.safeParse({
    adherentId: formData.get("adherentId"),
  });

  const pageRecherche = () => {
    const q = new URLSearchParams();
    if (recherche) q.set("recherche", recherche);
    return q;
  };

  if (!sessionCoursId) return;

  if (!resultat.success) {
    const q = pageRecherche();
    q.set("erreur", "Choisissez un adherent.");
    redirect(`/cours/${sessionCoursId}/inscrire?${q}`);
  }

  try {
    await reserverPlace(sessionCoursId, resultat.data);
  } catch (erreur) {
    const q = pageRecherche();
    q.set("erreur", messageErreur(erreur, "L'inscription a echoue. Reessayez."));
    redirect(`/cours/${sessionCoursId}/inscrire?${q}`);
  }

  revalidatePath(`/cours/${sessionCoursId}`);
  redirect(`/cours/${sessionCoursId}`);
}

export async function actionAnnulerReservation(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const sessionCoursId = String(formData.get("sessionCoursId") ?? "");
  if (!id || !sessionCoursId) return;

  await annulerReservation(id);
  revalidatePath(`/cours/${sessionCoursId}`);
}
