import { cn } from "@/lib/utils/cn";

/* Un ecran vide doit toujours proposer une action (CLAUDE.md §7).
   "Aucun adherent" tout seul laisse le gerant sans savoir quoi faire. */
export function EmptyState({
  icone,
  titre,
  description,
  action,
  className,
}: {
  icone?: React.ReactNode;
  titre: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        // Les quatre elements arrivent l'un apres l'autre. Un ecran vide est
        // le moment ou l'on a le plus besoin d'etre guide : la cascade
        // conduit l'oeil de l'icone vers le bouton, dans l'ordre de lecture.
        "cascade",
        className,
      )}
    >
      {icone && (
        <div className="relative mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          {/* Halo qui respire, tres doux. Il signale que l'ecran est vide
              par etat, pas parce qu'il a plante. */}
          <span className="absolute size-12 animate-pouls-doux rounded-full bg-brand/10" />
          <span className="relative">{icone}</span>
        </div>
      )}
      <h3 className="display font-semibold text-ink">{titre}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
