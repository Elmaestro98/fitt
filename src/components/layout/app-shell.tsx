"use client";

// Ce composant existe uniquement pour porter l'etat "menu ouvert" et le
// partager entre la Topbar (qui l'ouvre) et la Sidebar (qui se ferme).
// C'est le seul morceau vraiment interactif de la coquille : les pages
// qu'il enveloppe restent des Server Components.
import { useState } from "react";
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

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar ouverte={menuOuvert} onFermer={() => setMenuOuvert(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOuvrirMenu={() => setMenuOuvert(true)}
          notifications={notifications}
        />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
