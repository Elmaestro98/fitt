"use client";

// Annulation d'une commande par le staff.
//
// La commande n'est jamais supprimee (§9) : elle reste dans l'historique,
// marquee, avec son motif — c'est ce qui permet de repondre a l'adherent qui
// vient reclamer sa commande trois jours plus tard.
import { useActionState, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Textarea } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionAnnulerCommande,
  type EtatCommandeStaff,
} from "@/lib/actions/commande";

export function BoutonAnnulerCommande({
  commandeId,
  nomAdherent,
}: {
  commandeId: string;
  nomAdherent: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatCommandeStaff, FormData>(
    actionAnnulerCommande.bind(null, commandeId),
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
      >
        <X className="size-4" />
        Annuler
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Annuler cette commande"
        sousTitre={nomAdherent}
      >
        <form action={action} className="space-y-4">
          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <Champ
            label="Motif de l'annulation"
            htmlFor={`motif-${commandeId}`}
            requis
            erreurs={etat.erreurs?.motif}
            aide="Il sera visible par l'adherent dans son espace."
          >
            <Textarea
              id={`motif-${commandeId}`}
              name="motif"
              required
              minLength={3}
              autoFocus
              invalide={Boolean(etat.erreurs?.motif)}
              placeholder="Exemple : rupture de stock, commande non retiree."
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Rien n&apos;est encaisse et rien n&apos;est supprime : la commande
            reste dans l&apos;historique, marquee comme annulee.
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
