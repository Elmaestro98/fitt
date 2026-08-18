"use client";

// Annulation d'un encaissement.
//
// Ce bouton n'efface rien (CLAUDE.md §9) : il ecrit une ligne de contrepartie,
// de montant exactement oppose, qui vient se ranger dans le journal a cote de
// l'encaissement d'origine. Les deux lignes restent visibles.
import { useActionState, useEffect, useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Textarea } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionAnnulerPaiement,
  type EtatFormulaire,
} from "@/lib/actions/paiement";
import { formatFCFA } from "@/lib/utils/format";

export function BoutonAnnulerPaiement({
  paiementId,
  adherentId,
  montant,
  nomAdherent,
}: {
  paiementId: string;
  /** Sert uniquement a revalider la fiche concernee. */
  adherentId: string | null;
  montant: number;
  nomAdherent?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionAnnulerPaiement.bind(null, adherentId),
    {},
  );

  useEffect(() => {
    if (etat.succes) setOuvert(false);
  }, [etat.succes]);

  return (
    <>
      <Button
        type="button"
        variante="fantome"
        taille="sm"
        onClick={() => setOuvert(true)}
        aria-label={`Annuler le paiement de ${formatFCFA(montant)}`}
      >
        <Undo2 className="size-4" />
        <span className="hidden sm:inline">Annuler</span>
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Annuler cet encaissement"
        sousTitre={
          nomAdherent
            ? `${formatFCFA(montant)} · ${nomAdherent}`
            : formatFCFA(montant)
        }
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="paiementId" value={paiementId} />

          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <Champ
            label="Motif de l'annulation"
            htmlFor={`motif-${paiementId}`}
            requis
            erreurs={etat.erreurs?.motif}
            aide="Exemple : montant saisi deux fois, cheque sans provision, remboursement."
          >
            <Textarea
              id={`motif-${paiementId}`}
              name="motif"
              required
              minLength={5}
              autoFocus
              invalide={Boolean(etat.erreurs?.motif)}
              placeholder="Pourquoi cet encaissement est-il annule ?"
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Le paiement d&apos;origine reste dans le journal. Une ecriture de{" "}
            <strong className="font-medium text-ink">
              −{formatFCFA(montant).replace(" FCFA", "")} FCFA
            </strong>{" "}
            est ajoutee en face : c&apos;est elle qui corrige la recette.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
            >
              Retour
            </Button>
            <Button
              type="submit"
              variante="danger"
              disabled={enCours}
              className="border border-danger/30 bg-danger-soft"
            >
              {enCours ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </div>
        </form>
      </Modale>
    </>
  );
}
