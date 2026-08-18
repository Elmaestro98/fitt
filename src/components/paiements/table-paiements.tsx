// Tableau du journal de caisse de la salle. Server Component : seule la
// colonne d'action embarque du JavaScript.
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { BadgeMethode } from "@/components/paiements/badge-methode";
import { BoutonAnnulerPaiement } from "@/components/paiements/bouton-annuler-paiement";
import { formatDate, formatFCFA } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type LigneJournal = {
  id: string;
  montant: number;
  methode: string;
  type: string;
  reference: string | null;
  note: string | null;
  motif: string | null;
  encaisseLe: Date;
  contrepartie: { id: string; motif: string | null } | null;
  annule: { id: string } | null;
  abonnement: { id: string; nomFormule: string } | null;
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
};

export function TablePaiements({ lignes }: { lignes: LigneJournal[] }) {
  return (
    // Le tableau deborde horizontalement sur telephone plutot que d'ecraser
    // les colonnes : a 360 px, six colonnes compressees sont illisibles.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th>Date</Th>
            <Th>Adherent</Th>
            <Th>Objet</Th>
            <Th>Methode</Th>
            <Th className="text-right">Montant</Th>
            <th className="w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lignes.map((p) => {
            const nomComplet = `${p.adherent.prenom} ${p.adherent.nom}`;
            const contrepartie = p.type === "ANNULATION";
            const neutralise = Boolean(p.contrepartie);

            return (
              <tr key={p.id} className="transition-colors hover:bg-canvas">
                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {formatDate(p.encaisseLe)}
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
                  <span className={contrepartie ? "text-danger" : "text-ink"}>
                    {contrepartie
                      ? "Annulation"
                      : (p.abonnement?.nomFormule ?? "Encaissement")}
                  </span>
                  {(p.motif || p.reference) && (
                    <span className="block max-w-56 truncate text-xs text-muted">
                      {p.motif ? `Motif : ${p.motif}` : p.reference}
                    </span>
                  )}
                </td>

                <td className="px-5 py-3">
                  <BadgeMethode methode={p.methode} />
                </td>

                <td
                  className={cn(
                    "px-5 py-3 text-right font-semibold whitespace-nowrap",
                    contrepartie
                      ? "text-danger"
                      : neutralise
                        ? "text-muted line-through"
                        : "text-ink",
                  )}
                >
                  {contrepartie ? "−" : ""}
                  {formatFCFA(Math.abs(p.montant))}
                </td>

                <td className="px-5 py-3 text-right">
                  {/* Une contrepartie ne s'annule pas, un encaissement deja
                      annule non plus. */}
                  {!contrepartie && !neutralise && (
                    <BoutonAnnulerPaiement
                      paiementId={p.id}
                      adherentId={p.adherent.id}
                      montant={p.montant}
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
        "px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}
