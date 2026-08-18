import {
  BarChart3,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type EntreeNavigation = {
  libelle: string;
  href: string;
  icone: LucideIcon;
  /** Fonctionnalite pas encore livree : affichee, mais non cliquable. */
  lot?: number;
};

/* Ordre repris de la maquette. Deux libelles corriges par rapport a elle :
   "Membres" -> "Adherents" et "Presences" -> "Pointage" (CLAUDE.md §11). */
export const NAVIGATION: EntreeNavigation[] = [
  { libelle: "Tableau de bord", href: "/tableau-de-bord", icone: LayoutDashboard },
  { libelle: "Adherents", href: "/adherents", icone: Users, lot: 1 },
  { libelle: "Abonnements", href: "/abonnements", icone: CreditCard, lot: 1 },
  { libelle: "Paiements", href: "/paiements", icone: Wallet, lot: 1 },
  { libelle: "Pointage", href: "/pointage", icone: UserCheck, lot: 1 },
  { libelle: "Cours & coachs", href: "/cours", icone: Dumbbell, lot: 4 },
  { libelle: "Rapports", href: "/rapports", icone: BarChart3, lot: 5 },
];

export const NAVIGATION_BASSE: EntreeNavigation[] = [
  { libelle: "Parametres", href: "/parametres", icone: Settings, lot: 1 },
];
