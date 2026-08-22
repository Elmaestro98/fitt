import {
  etatAccesSalle,
  joursRestantsEssai,
  type SalleAccessible,
} from "@/lib/utils/acces-salle";

/**
 * Le statut d'une salle tel que le Super Admin doit le lire.
 *
 * Cinq etats, pas deux : actif=false recouvre a lui seul "jamais activee" et
 * "suspendue apres coup", deux situations a ne pas confondre (l'une attend
 * une decision, l'autre est une decision deja prise). Et une salle active se
 * subdivise a son tour selon sa relation commerciale — c'est ce qui separe
 * une cliente qui paie d'une salle en essai qui va peut-etre partir.
 *
 * /!\ Le verdict d'ACCES ne se calcule pas ici : il vient de etatAccesSalle
 * (lib/utils/acces-salle.ts), la regle unique partagee avec les deux portes
 * d'entree du produit. Ce fichier ne fait que l'habiller pour l'affichage.
 */
export type StatutSalle =
  | "abonnee"
  | "essai"
  | "essai_expire"
  | "active"
  | "en_attente"
  | "suspendue";

export function statutSalle(salle: SalleAccessible): StatutSalle {
  const acces = etatAccesSalle(salle);

  if (acces === "en-attente") return "en_attente";
  if (acces === "suspendue") return "suspendue";
  if (acces === "essai-expire") return "essai_expire";

  // Acces ouvert : reste a dire a quel titre.
  if (salle.abonnee) return "abonnee";
  return salle.essaiJusquau ? "essai" : "active";
}

export const LIBELLES_STATUT_SALLE: Record<StatutSalle, string> = {
  abonnee: "Abonnee",
  essai: "Essai",
  essai_expire: "Essai expire",
  active: "Active",
  en_attente: "En attente",
  suspendue: "Suspendue",
};

/**
 * Le detail de l'essai, en une ligne lisible.
 *
 * null quand il n'y a rien a dire — le badge suffit alors, et une seconde
 * ligne vide ferait du bruit.
 */
export function detailEssai(salle: SalleAccessible): string | null {
  if (salle.abonnee || !salle.essaiJusquau) return null;

  const jours = joursRestantsEssai(salle);
  if (jours === null) return null;
  if (jours === 0) return "Termine";

  return `${jours} jour${jours > 1 ? "s" : ""} restant${jours > 1 ? "s" : ""}`;
}
