// Colonne "Derniers passages" de public/kios.png.
//
// Elle melange deux sources : ce que le serveur avait au chargement, et les
// passages faits depuis, y compris ceux qui attendent encore le reseau. Un
// passage hors ligne s'affiche donc immediatement, comme les autres.
import { History } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

export type Passage = {
  id: string;
  horodatage: Date | string;
  statutAdherent: string;
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
  /** Passage encore dans la file locale. */
  local?: boolean;
};

const STATUTS: Record<string, { libelle: string; classe: string }> = {
  ACTIF: { libelle: "Actif", classe: "text-success" },
  EXPIRE: { libelle: "Expire", classe: "text-danger" },
  SUSPENDU: { libelle: "Suspendu", classe: "text-warning" },
  EN_ATTENTE_VALIDATION: { libelle: "En attente", classe: "text-muted" },
  ARCHIVE: { libelle: "Archive", classe: "text-muted" },
};

/** "14:32" a l'heure de Dakar. */
function heure(valeur: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  }).format(new Date(valeur));
}

export function ListePassages({ passages }: { passages: Passage[] }) {
  if (passages.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <History className="mx-auto size-6 text-muted" />
        <p className="mt-3 text-sm text-muted">
          Aucun passage aujourd&apos;hui.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {passages.map((p) => {
        const statut = STATUTS[p.statutAdherent] ?? STATUTS.ARCHIVE;
        const alerte =
          p.statutAdherent === "EXPIRE" || p.statutAdherent === "SUSPENDU";

        return (
          <li
            key={p.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              // La maquette encadre en rouge le passage d'un adherent expire :
              // c'est le seul cas qui demande une action de l'accueil.
              alerte && "bg-danger-soft/40",
            )}
          >
            <Avatar
              nom={`${p.adherent.prenom} ${p.adherent.nom}`}
              photoUrl={p.adherent.photoUrl}
              taille="sm"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {p.adherent.prenom} {p.adherent.nom}
              </p>
              <p className={cn("text-xs", statut.classe)}>
                {statut.libelle}
                {p.local && (
                  <span className="text-muted"> · en attente d&apos;envoi</span>
                )}
              </p>
            </div>

            <time
              dateTime={new Date(p.horodatage).toISOString()}
              className={cn(
                "text-sm font-medium tabular-nums",
                alerte ? "text-danger" : "text-muted",
              )}
            >
              {heure(p.horodatage)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
