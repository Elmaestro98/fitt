"use client";

// Ce composant existe uniquement pour porter l'etat "menu ouvert" et le
// partager entre la Topbar (qui l'ouvre) et la Sidebar (qui se ferme).
// C'est le seul morceau vraiment interactif de la coquille : les pages
// qu'il enveloppe restent des Server Components.
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Notification } from "@/lib/data/notifications";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  children,
  notifications = [],
}: {
  children: React.ReactNode;
  /** Resolues cote serveur par le layout : la coquille ne les cherche
   *  jamais elle-meme (§3). Vide par defaut, pour que l'ecran de blocage
   *  puisse afficher la coquille sans avoir lu la moindre donnee. */
  notifications?: Notification[];
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const chemin = usePathname();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Lien d'evitement : premier element atteint par la touche Tab, il
          saute la navigation pour aller au contenu. Invisible a la souris,
          il apparait des qu'il recoit le focus. Sans lui, naviguer au clavier
          impose de traverser les 12 entrees du menu a chaque page. */}
      <a
        href="#contenu"
        className={
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] " +
          "focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 " +
          "focus:text-sm focus:font-medium focus:text-white"
        }
      >
        Aller au contenu
      </a>

      <Sidebar ouverte={menuOuvert} onFermer={() => setMenuOuvert(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOuvrirMenu={() => setMenuOuvert(true)}
          notifications={notifications}
        />

        {/* key={chemin} : change d'identite a chaque changement de PAGE, donc
            React remonte le bloc et l'animation d'entree rejoue. Volontairement
            base sur le chemin seul, pas sur les parametres de recherche : un
            changement de filtre ou de page de pagination ne doit PAS refaire
            clignoter tout l'ecran — on ne rejoue l'entree que quand on arrive
            reellement ailleurs. */}
        <main
          id="contenu"
          key={chemin}
          className="animate-apparition flex-1 px-4 py-6 sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
