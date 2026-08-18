// Tableau des adherents. Server Component : aucune interactivite, donc aucun
// JavaScript envoye au navigateur pour ce composant.
//
// Structure reprise du tableau "Abonnements expirant bientot" de la maquette :
// avatar + nom + numero, puis les colonnes secondaires, puis l'action.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BadgeStatut, type StatutAdherent } from "@/components/ui/badge";
import { formaterTelephone } from "@/lib/utils/telephone";
import { formatDate } from "@/lib/utils/format";

type LigneAdherent = {
  id: string;
  numero: string;
  prenom: string;
  nom: string;
  telephone: string;
  statut: string;
  photoUrl: string | null;
  creeLe: Date;
};

/* Correspondance statut -> pastille de l'avatar. Volontairement partielle :
   un adherent archive ou en attente n'a pas de pastille. */
const PASTILLE = {
  ACTIF: "actif",
  EXPIRE: "expire",
  SUSPENDU: "suspendu",
} as const;

export function TableAdherents({ adherents }: { adherents: LigneAdherent[] }) {
  return (
    // Le tableau deborde horizontalement sur telephone plutot que d'ecraser
    // les colonnes : a 360 px, six colonnes compressees sont illisibles.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th>Adherent</Th>
            <Th>Telephone</Th>
            <Th>Statut</Th>
            <Th>Inscrit le</Th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {adherents.map((a) => {
            const nomComplet = `${a.prenom} ${a.nom}`;
            return (
              <tr key={a.id} className="transition-colors hover:bg-canvas">
                <td className="px-5 py-3">
                  <Link
                    href={`/adherents/${a.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      nom={nomComplet}
                      photoUrl={a.photoUrl}
                      statut={PASTILLE[a.statut as keyof typeof PASTILLE]}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {nomComplet}
                      </span>
                      <span className="block font-mono text-xs text-muted">
                        {a.numero}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {formaterTelephone(a.telephone)}
                </td>
                <td className="px-5 py-3">
                  <BadgeStatut statut={a.statut as StatutAdherent} />
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {formatDate(a.creeLe)}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/adherents/${a.id}`}
                    aria-label={`Ouvrir la fiche de ${nomComplet}`}
                    className="flex size-9 items-center justify-center rounded-control text-muted hover:bg-sunken hover:text-ink"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </th>
  );
}
