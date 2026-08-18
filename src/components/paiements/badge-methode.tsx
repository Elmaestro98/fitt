import { Badge } from "@/components/ui/badge";

/* Les trois canaux du marche senegalais (CLAUDE.md §1). Comme pour les
   statuts, la base stocke des MAJUSCULES non traduites et la traduction se
   fait ici, a un seul endroit. */
const METHODES = {
  ESPECES: { libelle: "Especes", ton: "neutre" },
  WAVE: { libelle: "Wave", ton: "info" },
  ORANGE_MONEY: { libelle: "Orange Money", ton: "alerte" },
} as const;

export type Methode = keyof typeof METHODES;

export function BadgeMethode({ methode }: { methode: string }) {
  const entree = METHODES[methode as Methode];
  if (!entree) return <Badge>{methode}</Badge>;
  return <Badge ton={entree.ton}>{entree.libelle}</Badge>;
}

export function libelleMethode(methode: string) {
  return METHODES[methode as Methode]?.libelle ?? methode;
}
