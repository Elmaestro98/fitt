// Tableau de la liste globale des abonnements. Server Component : seule la
// colonne d'action embarque du JavaScript (le bouton d'annulation).
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BoutonAnnuler } from "@/components/abonnements/bouton-annuler";
import { formatDate, formatFCFA } from "@/lib/utils/format";
import { joursRestants } from "@/lib/utils/duree";

type LigneAbonnement = {
  id: string;
  nomFormule: string;
  prixPaye: number;
  debutLe: Date;
  finLe: Date;
  statut: string;
  motifAnnul: string | null;
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
};

const STATUTS = {
  ACTIF: { libelle: "En cours", ton: "succes" },
  EXPIRE: { libelle: "Termine", ton: "neutre" },
  ANNULE: { libelle: "Annule", ton: "danger" },
} as const;

export function TableAbonnements({ lignes }: { lignes: LigneAbonnement[] }) {
  return (
    // Le tableau deborde horizontalement sur telephone plutot que d'ecraser
    // les colonnes : a 360 px, six colonnes compressees sont illisibles.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th>Adherent</Th>
            <Th>Formule</Th>
            <Th>Periode</Th>
            <Th>Echeance</Th>
            <Th>Montant</Th>
            <Th>Statut</Th>
            <th className="w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lignes.map((a) => {
            const nomComplet = `${a.adherent.prenom} ${a.adherent.nom}`;
            const { libelle, ton } = STATUTS[a.statut as keyof typeof STATUTS];

            return (
              <tr key={a.id} className="transition-colors hover:bg-canvas">
                <td className="px-5 py-3">
                  <Link
                    href={`/adherents/${a.adherent.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      nom={nomComplet}
                      photoUrl={a.adherent.photoUrl}
                      taille="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {nomComplet}
                      </span>
                      <span className="block font-mono text-xs text-muted">
                        {a.adherent.numero}
                      </span>
                    </span>
                  </Link>
                </td>

                <td className="px-5 py-3">
                  <span className="font-medium text-ink">{a.nomFormule}</span>
                  {a.motifAnnul && (
                    <span className="block max-w-48 truncate text-xs text-muted">
                      Motif : {a.motifAnnul}
                    </span>
                  )}
                </td>

                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {formatDate(a.debutLe)} → {formatDate(a.finLe)}
                </td>

                <td className="px-5 py-3 whitespace-nowrap">
                  <Echeance finLe={a.finLe} statut={a.statut} />
                </td>

                <td className="px-5 py-3 whitespace-nowrap font-medium text-ink">
                  {formatFCFA(a.prixPaye)}
                </td>

                <td className="px-5 py-3">
                  <Badge ton={ton}>{libelle}</Badge>
                </td>

                <td className="px-5 py-3 text-right">
                  {/* Seul un abonnement en cours peut etre annule : un contrat
                      deja termine n'a plus rien a annuler. */}
                  {a.statut === "ACTIF" && (
                    <BoutonAnnuler
                      abonnementId={a.id}
                      adherentId={a.adherent.id}
                      nomFormule={a.nomFormule}
                      nomAdherent={nomComplet}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Le compte a rebours du gerant. Seuls les abonnements en cours en ont un :
   afficher "-92 jours" sur un contrat termine il y a trois mois n'apporte
   rien. */
function Echeance({ finLe, statut }: { finLe: Date; statut: string }) {
  if (statut !== "ACTIF") {
    return <span className="text-muted">—</span>;
  }

  const restants = joursRestants(finLe);

  if (restants <= 0) {
    return <span className="font-medium text-danger">Echu</span>;
  }

  const couleur =
    restants <= 3 ? "text-danger" : restants <= 7 ? "text-warning" : "text-muted";

  return (
    <span className={couleur}>
      {restants} jour{restants > 1 ? "s" : ""}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </th>
  );
}
