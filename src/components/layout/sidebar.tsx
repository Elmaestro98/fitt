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
      {/* Voile sombre derriere le tiroir, sur mobile uniquement. */}
      {ouverte && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={onFermer}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar",
          // Mobile : tiroir qui glisse depuis la gauche.
          "transition-transform duration-200",
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
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

  // Actif aussi sur les sous-pages : /adherents/cmx123 surligne "Adherents".
  const actif =
    chemin === entree.href || chemin.startsWith(entree.href + "/");

  const contenu = (
    <>
      {/* Barre orange a gauche de l'entree selectionnee. */}
      <span
        className={cn(
          "absolute left-0 h-5 w-1 rounded-r-pill bg-brand",
          actif ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
      <Icone className="size-[18px] shrink-0" />
      <span className="truncate">{entree.libelle}</span>
    </>
  );

  const classes = cn(
    "relative flex items-center gap-3 rounded-control py-2.5 pr-3 pl-4",
    "text-sm transition-colors",
    actif
      ? "bg-sidebar-active font-medium text-brand"
      : "text-sidebar-text hover:bg-sidebar-active hover:text-white",
  );

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
