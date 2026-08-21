import { TrendingDown, TrendingUp } from "lucide-react";
import { formatFCFA } from "@/lib/utils/format";
import { moisCourantISO } from "@/lib/data/paiement";
import { cn } from "@/lib/utils/cn";

type Finances = {
  mois: string;
  total: number;
  totalMoisPrecedent: number;
  parSalle: { gymId: string; nom: string; montant: number }[];
};

/** "2026-08" -> "aout 2026". */
function libelleMois(iso: string): string {
  const [annee, mois] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(annee, mois - 1, 1)));
}

export function Finances({ finances }: { finances: Finances }) {
  const { mois, total, totalMoisPrecedent, parSalle } = finances;
  const moisCourant = moisCourantISO();

  const variation =
    totalMoisPrecedent > 0
      ? Math.round(((total - totalMoisPrecedent) / totalMoisPrecedent) * 100)
      : null;

  return (
    <div className="rounded-card border border-admin-line bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            Finances — {libelleMois(mois)}
          </p>
          <p className="mt-0.5 text-xs text-admin-muted">
            Encaissements nets (annulations deduites), toutes salles
            confondues.
          </p>
        </div>

        <form
          action="/admin"
          method="get"
          className="flex items-center gap-2"
        >
          <input
            type="month"
            name="mois"
            defaultValue={mois}
            max={moisCourant}
            className="h-9 rounded-control border border-admin-line bg-admin-bg px-2.5 text-xs text-admin-text focus:border-admin-accent focus:outline-none"
            style={{ colorScheme: "dark" }}
          />
          <button
            type="submit"
            className="h-9 rounded-control bg-admin-accent px-3 text-xs font-medium text-white hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
          >
            Voir
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <p className="font-[family-name:var(--font-mono-admin)] text-3xl font-medium tabular-nums">
          {formatFCFA(total)}
        </p>
        {variation !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-[family-name:var(--font-mono-admin)] text-xs",
              variation >= 0
                ? "bg-admin-success/15 text-admin-success"
                : "bg-admin-danger/15 text-admin-danger",
            )}
          >
            {variation >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {variation >= 0 ? "+" : ""}
            {variation}%
          </span>
        )}
        <span className="text-xs text-admin-muted">
          vs {formatFCFA(totalMoisPrecedent)} le mois precedent
        </span>
      </div>

      {parSalle.length === 0 ? (
        <p className="mt-4 border-t border-admin-line pt-4 text-sm text-admin-muted">
          Aucun encaissement sur ce mois.
        </p>
      ) : (
        <ul className="mt-4 space-y-2 border-t border-admin-line pt-4">
          {parSalle.map((s) => {
            const part = total > 0 ? Math.round((s.montant / total) * 100) : 0;
            return (
              <li key={s.gymId} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate">{s.nom}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-admin-line">
                  <span
                    className="block h-full rounded-pill bg-admin-accent"
                    style={{ width: `${part}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right font-[family-name:var(--font-mono-admin)] tabular-nums text-admin-muted">
                  {formatFCFA(s.montant)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
