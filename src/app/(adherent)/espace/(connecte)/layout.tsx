// Habillage des pages de l'espace ADHERENT CONNECTE.
//
// C'est le pendant exact de (dashboard)/layout.tsx : barre laterale sombre a
// gauche, barre haute, contenu au centre. Un adherent et un gerant doivent
// reconnaitre le meme produit.
//
// /!\ C'est ICI que la session est exigee, une fois, pour toutes les pages du
// groupe. Une page ajoutee demain dans ce dossier sera protegee sans que
// personne ait a y penser — le meme raisonnement que le middleware Clerk cote
// staff : on protege par defaut, on ouvre par exception.
//
// Le groupe (connecte) n'apparait pas dans les URL : les adresses restent
// /espace, /espace/seances, /espace/pointer.
import { ShellEspace } from "@/components/espace/shell-espace";
import { exigerSessionAdherent } from "@/lib/session-adherent";
import type { StatutAdherent } from "@/components/ui/badge";

export default async function EspaceConnecteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { gym, adherent } = await exigerSessionAdherent();

  return (
    <ShellEspace
      gymNom={gym.nom}
      prenom={adherent.prenom}
      nom={adherent.nom}
      numero={adherent.numero}
      photoUrl={adherent.photoUrl}
      statut={adherent.statut as StatutAdherent}
    >
      {children}
    </ShellEspace>
  );
}
