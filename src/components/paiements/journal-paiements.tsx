// Journal des paiements d'un adherent. Server Component : seule la colonne
// d'action embarque du JavaScript.
//
// Les deux natures de ligne sont montrees telles qu'elles existent en base :
// l'encaissement, et la contrepartie negative qui l'annule. Rien n'est masque
// — c'est le principe meme du journal en ajout seul (§9).
import { BadgeMethode } from "@/components/paiements/badge-methode";
import { BoutonAnnulerPaiement } from "@/components/paiements/bouton-annuler-paiement";
import { formatDate, formatFCFA } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type LignePaiement = {
  id: string;
  montant: number;
  methode: string;
  type: string;
  reference: string | null;
  note: string | null;
  motif: string | null;
  encaisseLe: Date;
  contrepartie: { id: string } | null;
  annule: { id: string } | null;
};

export function JournalPaiements({
  paiements,
  adherentId,
  nomAdherent,
}: {
  paiements: LignePaiement[];
  adherentId: string;
  nomAdherent: string;
}) {
  return (
    <ul className="divide-y divide-line">
      {paiements.map((p) => {
        const contrepartie = p.type === "ANNULATION";
        // Un encaissement deja annule reste affiche, barre : il a existe.
        const neutralise = Boolean(p.contrepartie);

        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "font-semibold",
                    contrepartie
                      ? "text-danger"
                      : neutralise
                        ? "text-muted line-through"
                        : "text-ink",
                  )}
                >
                  {contrepartie ? "−" : ""}
                  {formatFCFA(Math.abs(p.montant))}
                </span>
                <BadgeMethode methode={p.methode} />
              </p>

              <p className="mt-0.5 text-xs text-muted">
                {formatDate(p.encaisseLe)}
                {p.reference ? ` · ${p.reference}` : ""}
                {contrepartie ? " · ecriture d'annulation" : ""}
              </p>

              {p.motif && (
                <p className="mt-0.5 text-xs text-muted">Motif : {p.motif}</p>
              )}
              {p.note && (
                <p className="mt-0.5 text-xs text-muted">{p.note}</p>
              )}
            </div>

            {/* Seul un encaissement non encore annule peut l'etre. */}
            {!contrepartie && !neutralise && (
              <BoutonAnnulerPaiement
                paiementId={p.id}
                adherentId={adherentId}
                montant={p.montant}
                nomAdherent={nomAdherent}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
