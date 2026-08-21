import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatHeure } from "@/lib/utils/format";

type SessionCours = {
  id: string;
  debutLe: Date;
  dureeMinutes: number;
  capacite: number;
  placesReservees: number;
  statut: string;
  typeCours: { nom: string; couleur: string | null };
  coach: { prenom: string; nom: string };
};

export function LigneSession({ session }: { session: SessionCours }) {
  const complet = session.placesReservees >= session.capacite;

  return (
    <Link
      href={`/cours/${session.id}`}
      className="flex items-center gap-4 rounded-control border border-line bg-surface px-4 py-3 transition-colors hover:bg-canvas"
    >
      <div className="w-14 shrink-0 text-sm font-semibold text-ink">
        {formatHeure(session.debutLe)}
      </div>

      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: session.typeCours.couleur ?? "#FF6B35" }}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{session.typeCours.nom}</p>
        <p className="truncate text-sm text-muted">
          {session.coach.prenom} {session.coach.nom} · {session.dureeMinutes} min
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1 text-sm text-muted">
          <Users className="size-3.5" />
          {session.placesReservees}/{session.capacite}
        </span>
        {complet ? (
          <Badge ton="alerte">Complet</Badge>
        ) : (
          <Badge ton="succes">Places libres</Badge>
        )}
      </div>
    </Link>
  );
}
