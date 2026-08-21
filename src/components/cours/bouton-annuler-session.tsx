"use client";

// Annulation d'une seance de cours.
//
// Une seance ne se supprime jamais (CLAUDE.md §9). On l'annule, on date
// l'annulation et on exige un motif : dans six mois, le gerant doit pouvoir
// expliquer pourquoi ce cours a disparu du planning.
import { useActionState, useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Textarea } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionAnnulerSession,
  type EtatFormulaire,
} from "@/lib/actions/session-cours";

export function BoutonAnnulerSession({
  sessionCoursId,
  nomTypeCours,
}: {
  sessionCoursId: string;
  nomTypeCours: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionAnnulerSession.bind(null, sessionCoursId),
    {},
  );

  useEffect(() => {
    if (etat.succes) setOuvert(false);
  }, [etat.succes]);

  return (
    <>
      <Button
        type="button"
        variante="danger"
        taille="sm"
        onClick={() => setOuvert(true)}
      >
        <Ban className="size-4" />
        Annuler la seance
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Annuler cette seance"
        sousTitre={nomTypeCours}
      >
        <form action={action} className="space-y-4">
          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <Champ
            label="Motif de l'annulation"
            htmlFor={`motif-${sessionCoursId}`}
            requis
            erreurs={etat.erreurs?.motif}
            aide="Visible dans l'historique. Exemple : coach indisponible, salle indisponible."
          >
            <Textarea
              id={`motif-${sessionCoursId}`}
              name="motif"
              required
              minLength={5}
              autoFocus
              invalide={Boolean(etat.erreurs?.motif)}
              placeholder="Pourquoi cette seance est-elle annulee ?"
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Les adherents deja inscrits restent visibles sur la fiche, pour que
            vous puissiez les prevenir. La seance reste dans l&apos;historique,
            marquee «&nbsp;Annulee&nbsp;». Elle n&apos;est jamais supprimee.
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
