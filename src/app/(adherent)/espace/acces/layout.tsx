// Cadre de l'ecran d'acces : une colonne centree, sans menu.
//
// /!\ Cette page est SOUS /espace mais volontairement HORS du groupe
// (connecte), donc hors de la barre laterale. C'est ce qui evite la boucle :
// le shell exige une session, et c'est justement l'absence de session qui
// amene ici.
import { CadreSimple } from "@/components/espace/cadre-simple";

export default function AccesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CadreSimple>{children}</CadreSimple>;
}
