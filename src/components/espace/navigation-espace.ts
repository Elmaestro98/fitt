import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  ScanLine,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type EntreeEspace = {
  libelle: string;
  href: string;
  icone: LucideIcon;
};

/* Navigation de l'espace adherent.
   Volontairement courte : quatre entrees, toutes livrees. Contrairement a la
   navigation du staff, aucune entree "a venir" n'y figure — annoncer a un
   adherent une fonction qu'il n'aura pas avant six mois n'a aucun interet
   pour lui, alors que le gerant, lui, achete une feuille de route. */
export const NAVIGATION_ESPACE: EntreeEspace[] = [
  { libelle: "Mon espace", href: "/espace", icone: LayoutDashboard },
  { libelle: "Mes abonnements", href: "/espace/abonnements", icone: CreditCard },
  { libelle: "Mes cours", href: "/espace/cours", icone: Dumbbell },
  { libelle: "Mes seances", href: "/espace/seances", icone: CalendarCheck },
  { libelle: "Signaler ma presence", href: "/espace/pointer", icone: ScanLine },
];

export const NAVIGATION_ESPACE_BASSE: EntreeEspace[] = [
  { libelle: "Mon profil", href: "/espace/profil", icone: UserRound },
];
