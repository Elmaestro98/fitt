"use client";

// Barre d'onglets du bas, seule navigation de l'espace adherent SOUS lg.
//
// Remplace le tiroir/hamburger herite du back-office : un gerant est assis a
// un poste, un adherent consulte son telephone a une main, dans un vestiaire
// ou en marchant. Une barre en bas, accessible au pouce sans ouvrir de menu,
// est le pattern standard des applis mobiles grand public (CLAUDE.md §11 —
// mobile-first strict, utilisable a une main).
//
// A lg, la SidebarEspace reprend le relais (voir shell-espace.tsx) : cette
// barre ne s'affiche jamais aux cotes d'une sidebar, les deux sont exclusifs.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAVIGATION_ESPACE_ONGLETS } from "./navigation-espace";

export function BarreOngletsEspace() {
  const chemin = usePathname();

  return (
    <nav
      aria-label="Navigation de mon espace"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface lg:hidden",
        // pb-safe : sur un iPhone avec barre d'accueil, le dernier rang de
        // pixels est sous la poignee du systeme — sans cette marge, "Profil"
        // serait a moitie masque.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {NAVIGATION_ESPACE_ONGLETS.map((entree) => {
        const actif =
          entree.href === "/espace"
            ? chemin === entree.href
            : chemin === entree.href || chemin.startsWith(entree.href + "/");
        const Icone = entree.icone;

        return (
          <Link
            key={entree.href}
            href={entree.href}
            aria-current={actif ? "page" : undefined}
            // min-h-11 : cible tactile minimale (CLAUDE.md §11). La rangee
            // fait bien plus en pratique (~64 px avec le libelle), mais le
            // plancher reste garanti meme sur un tres petit ecran.
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px]",
              "transition-colors duration-[var(--duree-instant)] ease-sortie",
              actif ? "font-medium text-brand" : "text-muted",
            )}
          >
            <Icone
              className="size-5"
              // Le trait s'epaissit legerement sur l'onglet actif : un
              // deuxieme signal que la couleur seule, plus lisible en plein
              // soleil sur un ecran de telephone.
              strokeWidth={actif ? 2.5 : 2}
            />
            {entree.libelle}
          </Link>
        );
      })}
    </nav>
  );
}
