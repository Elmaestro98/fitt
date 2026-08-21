import {
  BarChart3,
  CreditCard,
  Tag,
  Dumbbell,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBag,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type EntreeNavigation = {
  libelle: string;
  href: string;
  icone: LucideIcon;
  /**
   * Renseigne UNIQUEMENT tant que l'ecran n'existe pas : l'entree reste
   * visible — le gerant voit ce qui vient — mais n'est pas cliquable, et
   * annonce son lot. Retirer ce champ le jour ou la page est livree.
   */
  lot?: number;
};

/* Ordre repris de la maquette. Deux libelles corriges par rapport a elle :
   "Membres" -> "Adherents" et "Presences" -> "Pointage" (CLAUDE.md §11). */
export const NAVIGATION: EntreeNavigation[] = [
  { libelle: "Tableau de bord", href: "/tableau-de-bord", icone: LayoutDashboard },
  { libelle: "Adherents", href: "/adherents", icone: Users },
  { libelle: "Abonnements", href: "/abonnements", icone: CreditCard },
  { libelle: "Formules", href: "/formules", icone: Tag },
  { libelle: "Boutique", href: "/boutique", icone: ShoppingBag },
  { libelle: "Commandes", href: "/commandes", icone: Receipt },
  { libelle: "Paiements", href: "/paiements", icone: Wallet },
  { libelle: "Pointage", href: "/pointage", icone: UserCheck },
  { libelle: "Cours & coachs", href: "/cours", icone: Dumbbell },
  { libelle: "Rapports", href: "/rapports", icone: BarChart3 },
];

export const NAVIGATION_BASSE: EntreeNavigation[] = [
  { libelle: "Parametres", href: "/parametres", icone: Settings },
];
