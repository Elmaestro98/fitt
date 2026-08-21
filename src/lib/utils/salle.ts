/**
 * Le statut d'une salle a trois etats reels, pas deux : actif=false recouvre
 * a la fois "jamais activee" et "suspendue apres coup", deux situations que
 * le Super Admin ne doit pas confondre (l'une attend une decision, l'autre
 * est une decision deja prise). activeeLe les distingue (§9 : voir gym.ts).
 */
export type StatutSalle = "active" | "en_attente" | "suspendue";

export function statutSalle(salle: {
  actif: boolean;
  activeeLe: Date | null;
}): StatutSalle {
  if (salle.actif) return "active";
  return salle.activeeLe ? "suspendue" : "en_attente";
}

export const LIBELLES_STATUT_SALLE: Record<StatutSalle, string> = {
  active: "Active",
  en_attente: "En attente",
  suspendue: "Suspendue",
};
