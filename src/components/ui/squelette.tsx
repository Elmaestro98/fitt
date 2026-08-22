import { cn } from "@/lib/utils/cn";

/**
 * Formes de chargement.
 *
 * Regle : on montre la FORME de ce qui arrive, jamais un rond qui tourne au
 * milieu d'une page blanche. Le squelette occupe deja la place finale, donc
 * la page ne saute pas quand les donnees arrivent, et l'attente parait plus
 * courte parce que l'oeil a deja quelque chose a lire.
 *
 * A brancher sur les `loading.tsx` de Next.js : le squelette s'affiche
 * pendant que le Server Component interroge PostgreSQL.
 */
export function Squelette({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("squelette h-4 w-full", className)}
      {...props}
    />
  );
}

/** Carte d'indicateur en attente — meme gabarit que <StatCard>. */
export function SqueletteStat() {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <Squelette className="h-3 w-24" />
        <Squelette className="size-8 rounded-control" />
      </div>
      <Squelette className="mt-4 h-8 w-28" />
      <Squelette className="mt-2 h-3 w-36" />
    </div>
  );
}

/** Tableau en attente. `lignes` doit approcher le nombre reel attendu :
 *  trop peu et la page saute a l'arrivee des donnees, trop et elle se
 *  retracte. */
export function SqueletteTable({ lignes = 6 }: { lignes?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <Squelette className="h-3 w-32" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: lignes }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Squelette className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Squelette className="h-3.5 w-40 max-w-full" />
              <Squelette className="h-3 w-24" />
            </div>
            <Squelette className="hidden h-6 w-20 rounded-pill sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Page complete en attente : en-tete + bandeau d'indicateurs + tableau. */
export function SquelettePage({ stats = 4 }: { stats?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Squelette className="h-7 w-52" />
        <Squelette className="h-3.5 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <SqueletteStat key={i} />
        ))}
      </div>
      <SqueletteTable />
    </div>
  );
}
