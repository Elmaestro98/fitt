// Simples liens, pas de useState : le filtre vit dans l'URL (memes raisons
// que barre-filtres.tsx ailleurs dans l'app), et il n'y a ici aucune saisie a
// debouncer — un composant serveur suffit, pas de JS necessaire.
import Link from "next/link";
import { PERIODES_RAPPORT, type PeriodeRapport } from "@/lib/data/rapport";
import { cn } from "@/lib/utils/cn";

const LIBELLES: Record<PeriodeRapport, string> = {
  3: "3 mois",
  6: "6 mois",
  12: "12 mois",
  24: "24 mois",
};

export function FiltrePeriode({ actif }: { actif: PeriodeRapport }) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {PERIODES_RAPPORT.map((p) => (
        <Link
          key={p}
          href={p === 12 ? "/rapports" : `/rapports?mois=${p}`}
          className={cn(
            "flex h-9 min-h-9 items-center rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
            p === actif
              ? "bg-ink font-medium text-white"
              : "bg-surface text-muted hover:bg-sunken hover:text-ink",
          )}
        >
          {LIBELLES[p]}
        </Link>
      ))}
    </div>
  );
}
