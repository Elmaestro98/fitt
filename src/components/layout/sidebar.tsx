"use client";

// Composant client : il a besoin de connaitre l'URL courante (usePathname)
// pour surligner l'entree active. C'est de l'interactivite reelle, donc
// "use client" est justifie ici (CLAUDE.md §7).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/logo";
import {
  NAVIGATION,
  NAVIGATION_BASSE,
  type EntreeNavigation,
} from "./navigation";

export function Sidebar({
  ouverte,
  onFermer,
}: {
  ouverte: boolean;
  onFermer: () => void;
}) {
  return (
    <>
      {/* Voile sombre derriere le tiroir, sur mobile uniquement. Il monte en
          fondu : sans ca, l'ecran s'assombrit d'un coup pendant que le tiroir,
          lui, glisse — deux vitesses differentes pour un seul geste. */}
      {ouverte && (
        <div
          className="animate-voile fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px] lg:hidden"
          onClick={onFermer}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar",
          // Mobile : tiroir qui glisse depuis la gauche, avec la courbe du
          // design system plutot qu'une transition lineaire.
          "transition-transform duration-[var(--duree-courte)] ease-sortie",
          ouverte ? "translate-x-0" : "-translate-x-full",
          // A partir de lg, la barre est toujours visible et fait partie du flux.
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        )}
        aria-label="Navigation principale"
      >
        <div className="flex items-center justify-between px-5 py-6">
          <Link href="/tableau-de-bord" onClick={onFermer}>
            <Logo hauteur={26} prioritaire />
            <span className="mt-1 block text-[11px] text-sidebar-text">
              Gestion de salle
            </span>
          </Link>

          <button
            type="button"
            onClick={onFermer}
            className="rounded-control p-2 text-sidebar-text hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* cascade : les entrees de menu se posent l'une apres l'autre au
            premier chargement. C'est le seul endroit de l'app ou l'on se
            permet une entree un peu demonstrative — c'est le premier ecran,
            il donne le ton, et on ne le revoit pas a chaque navigation
            (la coquille n'est pas re-rendue entre deux pages). */}
        <nav className="cascade flex-1 space-y-1 overflow-y-auto px-3">
          {NAVIGATION.map((entree) => (
            <LienNav key={entree.href} entree={entree} onNaviguer={onFermer} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          {NAVIGATION_BASSE.map((entree) => (
            <LienNav key={entree.href} entree={entree} onNaviguer={onFermer} />
          ))}
        </div>
      </aside>
    </>
  );
}

function LienNav({
  entree,
  onNaviguer,
}: {
  entree: EntreeNavigation;
  onNaviguer: () => void;
}) {
  const chemin = usePathname();
  const Icone = entree.icone;

  // Ecran pas encore livre : on l'affiche pour annoncer ce qui vient, mais on
  // ne laisse pas cliquer vers un 404.
  const aVenir = typeof entree.lot === "number";

  // Actif aussi sur les sous-pages : /adherents/cmx123 surligne "Adherents".
  const actif =
    chemin === entree.href || chemin.startsWith(entree.href + "/");

  const contenu = (
    <>
      {/* Barre orange a gauche de l'entree selectionnee. Elle ne se contente
          plus d'apparaitre : elle se deploie verticalement depuis son centre,
          ce qui donne l'impression qu'elle SUIT la selection. */}
      <span
        className={cn(
          "absolute left-0 h-5 w-1 rounded-r-pill bg-brand",
          "origin-center transition-transform duration-[var(--duree-courte)] ease-ressort",
          actif ? "scale-y-100" : "scale-y-0",
        )}
        aria-hidden="true"
      />
      {/* L'icone avance de 2 px au survol : un mouvement minuscule, mais qui
          rend la ligne "vivante" sous le curseur. */}
      <Icone
        className={cn(
          "size-[18px] shrink-0 transition-transform duration-[var(--duree-instant)] ease-sortie",
          !actif && "group-hover/nav:translate-x-0.5",
        )}
      />
      <span className="truncate">{entree.libelle}</span>
      {aVenir && (
        <span className="ml-auto rounded-pill bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
          Lot {entree.lot}
        </span>
      )}
    </>
  );

  const classes = cn(
    "group/nav relative flex items-center gap-3 rounded-control py-2.5 pr-3 pl-4",
    "text-sm transition-[color,background-color] duration-[var(--duree-instant)] ease-sortie",
    // Le libelle de l'entree ACTIVE passe en display : la selection se lit
    // alors a trois signaux (fond, couleur, forme des lettres) au lieu d'un.
    actif
      ? "display bg-sidebar-active font-semibold text-brand"
      : "text-sidebar-text hover:bg-sidebar-active hover:text-white",
  );

  if (aVenir) {
    return (
      <span
        className={cn(classes, "cursor-not-allowed opacity-45")}
        aria-disabled="true"
        title={`Disponible au lot ${entree.lot}`}
      >
        {contenu}
      </span>
    );
  }

  return (
    <Link
      href={entree.href}
      onClick={onNaviguer}
      className={classes}
      aria-current={actif ? "page" : undefined}
    >
      {contenu}
    </Link>
  );
}
