"use client";

// Coquille de l'espace adherent, pendant de components/layout/app-shell.tsx.
//
// Elle n'existe que pour porter l'etat "menu ouvert" et le partager entre la
// barre haute (qui l'ouvre) et la barre laterale (qui se ferme). Les pages
// qu'elle enveloppe restent des Server Components.
//
// /!\ Les informations de l'adherent lui sont passees en props par le layout,
// qui les tient de la session (§3). Ce composant client ne va JAMAIS les
// chercher lui-meme : rien de ce qui touche au tenant ne se resout dans le
// navigateur.
import { useState } from "react";
import type { StatutAdherent } from "@/components/ui/badge";
import { SidebarEspace } from "./sidebar-espace";
import { TopbarEspace } from "./topbar-espace";

export function ShellEspace({
  gymNom,
  prenom,
  nom,
  numero,
  photoUrl,
  statut,
  children,
}: {
  gymNom: string;
  prenom: string;
  nom: string;
  numero: string;
  photoUrl: string | null;
  statut: StatutAdherent;
  children: React.ReactNode;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <SidebarEspace
        gymNom={gymNom}
        ouverte={menuOuvert}
        onFermer={() => setMenuOuvert(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarEspace
          prenom={prenom}
          nom={nom}
          numero={numero}
          photoUrl={photoUrl}
          statut={statut}
          onOuvrirMenu={() => setMenuOuvert(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
