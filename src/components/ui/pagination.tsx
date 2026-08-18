import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* Pagination par liens (et non par boutons) : chaque page a sa propre URL.
   Le gerant peut la mettre en favori, l'ouvrir dans un onglet, revenir en
   arriere avec le bouton du navigateur. */
export function Pagination({
  page,
  pages,
  total,
  hrefPour,
}: {
  page: number;
  pages: number;
  total: number;
  hrefPour: (page: number) => string;
}) {
  if (pages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-4 border-t border-line px-5 py-3"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Page {page} sur {pages}
        <span className="hidden sm:inline"> · {total} adherents</span>
      </p>

      <div className="flex items-center gap-2">
        <LienPage
          href={hrefPour(page - 1)}
          desactive={page <= 1}
          label="Page precedente"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Precedent</span>
        </LienPage>
        <LienPage
          href={hrefPour(page + 1)}
          desactive={page >= pages}
          label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="size-4" />
        </LienPage>
      </div>
    </nav>
  );
}

function LienPage({
  href,
  desactive,
  label,
  children,
}: {
  href: string;
  desactive: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "inline-flex h-9 min-h-9 items-center gap-1 rounded-control border px-3 text-sm",
    desactive
      ? "pointer-events-none border-line text-muted opacity-50"
      : "border-line text-ink hover:bg-sunken",
  );

  if (desactive) {
    return (
      <span className={classes} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={classes} aria-label={label}>
      {children}
    </Link>
  );
}
