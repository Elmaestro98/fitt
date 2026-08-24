"use client";

// Barre laterale de l'espace adherent — DESKTOP UNIQUEMENT (lg et plus).
//
// Sous lg, c'est BarreOngletsEspace (barre d'onglets en bas) qui porte toute
// la navigation : un adherent au telephone n'a pas de tiroir a ouvrir, un
// gerant au clavier retrouve la meme sidebar que le back-office
// (components/layout/sidebar.tsx) — meme fond #2D3133, meme barre orange sur
// l'entree active. Les deux ne coexistent jamais (voir shell-espace.tsx).
//
// Ce qu'elle ne reprend PAS, et volontairement : le selecteur d'organisation.
// Un adherent appartient a UNE salle et une seule (§4). Il n'y a rien a
// choisir, et le nom de sa salle est une information, pas un menu.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/logo";
import {
  NAVIGATION_ESPACE,
  NAVIGATION_ESPACE_BASSE,
  type EntreeEspace,
} from "./navigation-espace";

export function SidebarEspace({ gymNom }: { gymNom: string }) {
  return (
    <aside
      className="hidden bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col"
      aria-label="Navigation de mon espace"
    >
      <div className="px-5 py-6">
        <Link href="/espace" className="min-w-0">
          <Logo hauteur={26} prioritaire />
          {/* Le nom de la salle a la place de "Gestion de salle" : c'est ce
              qui situe l'adherent, et il ne change jamais. */}
          <span className="mt-1 block truncate text-[11px] text-sidebar-text">
            {gymNom}
          </span>
        </Link>
      </div>

      <nav className="cascade flex-1 space-y-1 overflow-y-auto px-3">
        {NAVIGATION_ESPACE.map((entree) => (
          <LienEspace key={entree.href} entree={entree} />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {NAVIGATION_ESPACE_BASSE.map((entree) => (
          <LienEspace key={entree.href} entree={entree} />
        ))}
      </div>
    </aside>
  );
}

function LienEspace({ entree }: { entree: EntreeEspace }) {
  const chemin = usePathname();
  const Icone = entree.icone;

  // Comparaison exacte pour "/espace" : toutes les autres pages commencent par
  // ce chemin, l'accueil resterait sinon surligne en permanence.
  const actif =
    entree.href === "/espace"
      ? chemin === entree.href
      : chemin === entree.href || chemin.startsWith(entree.href + "/");

  return (
    <Link
      href={entree.href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-control py-2.5 pr-3 pl-4",
        "text-sm transition-[color,background-color] duration-[var(--duree-instant)] ease-sortie",
        actif
          ? "display bg-sidebar-active font-semibold text-brand"
          : "text-sidebar-text hover:bg-sidebar-active hover:text-white",
      )}
    >
      <span
        className={cn(
          "absolute left-0 h-5 w-1 rounded-r-pill bg-brand",
          "origin-center transition-transform duration-[var(--duree-courte)] ease-ressort",
          actif ? "scale-y-100" : "scale-y-0",
        )}
        aria-hidden="true"
      />
      <Icone
        className={cn(
          "size-[18px] shrink-0 transition-transform duration-[var(--duree-instant)] ease-sortie",
          !actif && "group-hover/nav:translate-x-0.5",
        )}
      />
      <span className="truncate">{entree.libelle}</span>
    </Link>
  );
}
