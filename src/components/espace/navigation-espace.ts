import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Receipt,
  ScanLine,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type EntreeEspace = {
  libelle: string;
  href: string;
  icone: LucideIcon;
};

/* Navigation de l'espace adherent.
   Volontairement courte, et toutes les entrees sont livrees. Contrairement a
   la navigation du staff, aucune entree "a venir" n'y figure — annoncer a un
   adherent une fonction qu'il n'aura pas avant six mois n'a aucun interet
   pour lui, alors que le gerant, lui, achete une feuille de route. */
export const NAVIGATION_ESPACE: EntreeEspace[] = [
  { libelle: "Mon espace", href: "/espace", icone: LayoutDashboard },
  { libelle: "Mes abonnements", href: "/espace/abonnements", icone: CreditCard },
  { libelle: "Mes cours", href: "/espace/cours", icone: Dumbbell },
  { libelle: "Mes seances", href: "/espace/seances", icone: CalendarCheck },
  { libelle: "Signaler ma presence", href: "/espace/pointer", icone: ScanLine },
  { libelle: "Boutique", href: "/espace/boutique", icone: ShoppingBag },
  { libelle: "Mes commandes", href: "/espace/commandes", icone: Receipt },
];

export const NAVIGATION_ESPACE_BASSE: EntreeEspace[] = [
  { libelle: "Mon profil", href: "/espace/profil", icone: UserRound },
];

/**
 * Les 5 destinations de la barre d'onglets mobile (BarreOngletsEspace).
 *
 * Volontairement plus courte que NAVIGATION_ESPACE (7 entrees) : au pouce, en
 * bas d'un ecran de telephone, 5 est le maximum lisible d'un coup d'oeil.
 * Boutique et Mes commandes restent a une portee (raccourcis de l'accueil,
 * menu complet de la sidebar en desktop) mais pas dans la barre — occasionnels,
 * ils n'ont pas la meme frequence d'usage que le pointage ou les abonnements.
 * "Mes cours" prime sur "Mes seances" dans les 5 : le premier repond a "quand
 * dois-je revenir ?" (actionnable), le second n'est qu'un historique passif.
 */
export const NAVIGATION_ESPACE_ONGLETS: EntreeEspace[] = [
  { libelle: "Accueil", href: "/espace", icone: LayoutDashboard },
  { libelle: "Pointer", href: "/espace/pointer", icone: ScanLine },
  { libelle: "Cours", href: "/espace/cours", icone: Dumbbell },
  { libelle: "Abos", href: "/espace/abonnements", icone: CreditCard },
  { libelle: "Profil", href: "/espace/profil", icone: UserRound },
];
