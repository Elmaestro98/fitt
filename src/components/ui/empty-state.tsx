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
        className,
      )}
    >
      {icone && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          {icone}
        </div>
      )}
      <h3 className="font-semibold text-ink">{titre}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
