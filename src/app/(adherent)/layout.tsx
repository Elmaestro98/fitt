// Racine du groupe (adherent) — CLAUDE.md §7.
//
// Volontairement sans habillage : les deux mondes de ce groupe ne se
// ressemblent pas, et un cadre commun ne servirait qu'a les faire se
// contredire.
//
//   espace/(connecte)/  -> ShellEspace : barre laterale, comme le back-office
//   activer/, acces/    -> CadreSimple : une colonne centree, personne n'est
//                          encore identifie
//
// Ce layout ne porte donc que les metadonnees communes. Aucun ClerkProvider
// supplementaire, aucun composant Clerk : un adherent n'a pas de compte Clerk
// et ne doit jamais en avoir un (§5, §9).
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon espace — Fitt",
  // Un espace personnel n'a rien a faire dans un moteur de recherche.
  robots: { index: false, follow: false },
};

export default function AdherentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
