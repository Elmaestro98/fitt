"use client";

// Annulation d'un abonnement.
//
// Un abonnement ne se supprime JAMAIS (CLAUDE.md §9). On l'annule, on date
// l'annulation et on exige un motif : dans six mois, le gerant doit pouvoir
// expliquer pourquoi cette vente a disparu de son chiffre d'affaires.
import { useActionState, useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Textarea } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionAnnulerAbonnement,
  type EtatFormulaire,
} from "@/lib/actions/abonnement";

export function BoutonAnnuler({
  abonnementId,
  adherentId,
  nomFormule,
  nomAdherent,
  taille = "sm",
}: {
  abonnementId: string;
  /** Sert uniquement a revalider la fiche concernee apres l'annulation. */
  adherentId: string | null;
  nomFormule: string;
  nomAdherent?: string;
  taille?: "sm" | "md";
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionAnnulerAbonnement.bind(null, adherentId),
    {},
  );

  // Le serveur confirme : on referme. Tant qu'il renvoie une erreur, la
  // modale reste ouverte avec le motif deja saisi.
  useEffect(() => {
    if (etat.succes) setOuvert(false);
  }, [etat.succes]);

  return (
    <>
      <Button
        type="button"
        variante="danger"
        taille={taille}
        onClick={() => setOuvert(true)}
      >
        <Ban className="size-4" />
        Annuler
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Annuler cet abonnement"
        sousTitre={nomAdherent ? `${nomFormule} · ${nomAdherent}` : nomFormule}
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="abonnementId" value={abonnementId} />

          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <Champ
            label="Motif de l'annulation"
            htmlFor={`motif-${abonnementId}`}
            requis
            erreurs={etat.erreurs?.motif}
            aide="Visible dans l'historique. Exemple : erreur de saisie, remboursement accorde."
          >
            <Textarea
              id={`motif-${abonnementId}`}
              name="motif"
              required
              minLength={5}
              autoFocus
              invalide={Boolean(etat.erreurs?.motif)}
              placeholder="Pourquoi cet abonnement est-il annule ?"
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            L&apos;abonnement reste dans l&apos;historique, marque
            «&nbsp;Annule&nbsp;». Il n&apos;est jamais supprime.
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
