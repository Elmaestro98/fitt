"use client";

// Barre laterale de l'espace adherent.
//
// Meme construction que celle du back-office (components/layout/sidebar.tsx) :
// meme fond #2D3133, meme barre orange sur l'entree active, meme tiroir
// coulissant sous lg. Un adherent et un gerant doivent reconnaitre le meme
// produit.
//
// Ce qu'elle ne reprend PAS, et volontairement : le selecteur d'organisation.
// Un adherent appartient a UNE salle et une seule (§4). Il n'y a rien a
// choisir, et le nom de sa salle est une information, pas un menu.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/logo";
import {
  NAVIGATION_ESPACE,
  NAVIGATION_ESPACE_BASSE,
  type EntreeEspace,
} from "./navigation-espace";

export function SidebarEspace({
  gymNom,
  ouverte,
  onFermer,
}: {
  gymNom: string;
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
          "transition-transform duration-200",
          ouverte ? "translate-x-0" : "-translate-x-full",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        )}
        aria-label="Navigation de mon espace"
      >
        <div className="flex items-start justify-between px-5 py-6">
          <Link href="/espace" onClick={onFermer} className="min-w-0">
            <Logo hauteur={26} prioritaire />
            {/* Le nom de la salle a la place de "Gestion de salle" : c'est ce
                qui situe l'adherent, et il ne change jamais. */}
            <span className="mt-1 block truncate text-[11px] text-sidebar-text">
              {gymNom}
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
          {NAVIGATION_ESPACE.map((entree) => (
            <LienEspace
              key={entree.href}
              entree={entree}
              onNaviguer={onFermer}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          {NAVIGATION_ESPACE_BASSE.map((entree) => (
            <LienEspace
              key={entree.href}
              entree={entree}
              onNaviguer={onFermer}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function LienEspace({
  entree,
  onNaviguer,
}: {
  entree: EntreeEspace;
  onNaviguer: () => void;
}) {
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
      onClick={onNaviguer}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-control py-2.5 pr-3 pl-4",
        "text-sm transition-colors",
        actif
          ? "bg-sidebar-active font-medium text-brand"
          : "text-sidebar-text hover:bg-sidebar-active hover:text-white",
      )}
    >
      <span
        className={cn(
          "absolute left-0 h-5 w-1 rounded-r-pill bg-brand",
          actif ? "opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
      />
      <Icone className="size-[18px] shrink-0" />
      <span className="truncate">{entree.libelle}</span>
    </Link>
  );
}
