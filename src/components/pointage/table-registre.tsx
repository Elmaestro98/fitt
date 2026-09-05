// Tableau du registre de presence. Server Component : aucun JavaScript n'est
// envoye au navigateur pour l'afficher.
//
// Les passages sont groupes par jour, avec une ligne d'intitule a chaque
// changement de date. Un registre se lit par journees ("le 3 septembre, 42
// passages"), pas comme une liste plate de 25 horodatages.
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeStatut, type StatutAdherent } from "@/components/ui/badge";
import { formatDateLongue, formatHeure } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type LigneRegistre = {
  id: string;
  horodatage: Date;
  source: string;
  statutAdherent: string;
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
};

/* La source dit QUI a enregistre le passage. Elle compte pour arbitrer un
   litige : "je suis venu" face a un registre vide se tranche autrement selon
   que la salle pointe a la borne ou que l'adherent se declare seul. */
const SOURCES: Record<string, { libelle: string; ton: "neutre" | "info" }> = {
  KIOSQUE: { libelle: "Borne", ton: "neutre" },
  STAFF: { libelle: "Reception", ton: "neutre" },
  ADHERENT: { libelle: "Espace adherent", ton: "info" },
};

/** "2026-09-03" — la cle de regroupement, en UTC comme le reste (§8). */
function cleJour(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function TableRegistre({ lignes }: { lignes: LigneRegistre[] }) {
  let jourPrecedent = "";

  return (
    // Le tableau deborde horizontalement sur telephone plutot que d'ecraser
    // les colonnes : a 360 px, quatre colonnes compressees sont illisibles.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th className="w-24">Heure</Th>
            <Th>Adherent</Th>
            <Th>Statut au passage</Th>
            <Th className="text-right">Enregistre par</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lignes.map((p) => {
            const nomComplet = `${p.adherent.prenom} ${p.adherent.nom}`;
            const jour = cleJour(p.horodatage);
            const nouveauJour = jour !== jourPrecedent;
            jourPrecedent = jour;

            const source = SOURCES[p.source] ?? {
              libelle: p.source,
              ton: "neutre" as const,
            };

            return (
              <RangeeJour key={p.id} intitule={nouveauJour ? p.horodatage : null}>
                <td className="px-5 py-3 font-mono whitespace-nowrap text-muted">
                  {formatHeure(p.horodatage)}
                </td>

                <td className="px-5 py-3">
                  <Link
                    href={`/adherents/${p.adherent.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      nom={nomComplet}
                      photoUrl={p.adherent.photoUrl}
                      taille="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {nomComplet}
                      </span>
                      <span className="block font-mono text-xs text-muted">
                        {p.adherent.numero}
                      </span>
                    </span>
                  </Link>
                </td>

                <td className="px-5 py-3">
                  {/* Le statut PHOTOGRAPHIE au moment du passage, jamais celui
                      d'aujourd'hui : un adherent qui a renouvele depuis ne
                      doit pas reecrire l'histoire du registre (§9). */}
                  <BadgeStatut statut={p.statutAdherent as StatutAdherent} />
                </td>

                <td className="px-5 py-3 text-right">
                  <Badge ton={source.ton}>{source.libelle}</Badge>
                </td>
              </RangeeJour>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Une rangee, precedee de l'intitule de la journee quand elle l'ouvre.
 *
 * Un fragment plutot qu'un composant a part : la ligne de titre et la ligne
 * de passage doivent rester des enfants directs du <tbody>, sinon le HTML du
 * tableau est invalide et le navigateur les sort de la table.
 */
function RangeeJour({
  intitule,
  children,
}: {
  intitule: Date | null;
  children: React.ReactNode;
}) {
  return (
    <>
      {intitule && (
        <tr className="bg-canvas">
          <th
            colSpan={4}
            scope="colgroup"
            className="display px-5 py-2 text-left text-xs font-semibold text-muted"
          >
            {formatDateLongue(intitule)}
          </th>
        </tr>
      )}
      <tr className="rangee hover:bg-canvas">{children}</tr>
    </>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "display px-5 py-3 text-xs font-semibold tracking-wide text-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}
