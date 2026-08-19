// Cadre de l'activation : une colonne centree, sans menu.
//
// Personne n'est encore identifie a ce stade — le jeton n'a pas ete consomme.
// La barre laterale n'apparait qu'une fois la session ouverte.
import { CadreSimple } from "@/components/espace/cadre-simple";

export default function ActiverLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CadreSimple>{children}</CadreSimple>;
}
