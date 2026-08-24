"use client";

// Coquille de l'espace adherent, pendant de components/layout/app-shell.tsx.
//
// Sous lg : SidebarEspace disparait, BarreOngletsEspace (barre d'onglets du
// bas) porte toute la navigation — pas de tiroir a ouvrir/fermer, donc plus
// d'etat "menu ouvert" a faire circuler ici (contrairement a app-shell.tsx
// cote back-office, qui garde son tiroir). A lg, c'est l'inverse : la
// sidebar reprend, la barre du bas disparait. Les deux ne coexistent jamais.
//
// /!\ Les informations de l'adherent lui sont passees en props par le layout,
// qui les tient de la session (§3). Ce composant client ne va JAMAIS les
// chercher lui-meme : rien de ce qui touche au tenant ne se resout dans le
// navigateur.
import { usePathname } from "next/navigation";
import type { StatutAdherent } from "@/components/ui/badge";
import { SidebarEspace } from "./sidebar-espace";
import { TopbarEspace } from "./topbar-espace";
import { BarreOngletsEspace } from "./barre-onglets-espace";

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
  const chemin = usePathname();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Lien d'evitement, comme cote back-office : la premiere tabulation
          saute la navigation pour aller droit au contenu. */}
      <a
        href="#contenu-espace"
        className={
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] " +
          "focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 " +
          "focus:text-sm focus:font-medium focus:text-white"
        }
      >
        Aller au contenu
      </a>
      <SidebarEspace gymNom={gymNom} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarEspace
          prenom={prenom}
          nom={nom}
          numero={numero}
          photoUrl={photoUrl}
          statut={statut}
        />
        {/* key={chemin} : l'entree rejoue a chaque changement de page, pas a
            chaque changement de filtre. Voir app-shell.tsx cote back-office.
            pb-24 : sous lg, la barre d'onglets fixee en bas ne doit pas
            recouvrir le dernier element du contenu. */}
        <main
          id="contenu-espace"
          key={chemin}
          className="animate-apparition flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-6"
        >
          {children}
        </main>

        <BarreOngletsEspace />
      </div>
    </div>
  );
}
