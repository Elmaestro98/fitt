"use client";

// Remise d'une commande a l'adherent, avec encaissement.
//
// /!\ Le montant n'est PAS saisi ici : il est recalcule cote serveur depuis
// les lignes figees de la commande (§9). Cet ecran ne demande donc qu'une
// chose au staff — comment l'adherent a paye.
import { useActionState, useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionRemettreCommande,
  type EtatCommandeStaff,
} from "@/lib/actions/commande";
import { formatFCFA } from "@/lib/utils/format";

export function BoutonRemettre({
  commandeId,
  montant,
  nomAdherent,
}: {
  commandeId: string;
  montant: number;
  nomAdherent: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatCommandeStaff, FormData>(
    actionRemettreCommande.bind(null, commandeId),
    {},
  );

  useEffect(() => {
    if (etat.succes) setOuvert(false);
  }, [etat.succes]);

  return (
    <>
      <Button type="button" taille="sm" onClick={() => setOuvert(true)}>
        <HandCoins className="size-4" />
        Remettre et encaisser
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Remettre la commande"
        sousTitre={`${formatFCFA(montant)} · ${nomAdherent}`}
      >
        <form action={action} className="space-y-4">
          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <div className="rounded-control bg-sunken px-4 py-3">
            <p className="text-xs text-muted">Montant a encaisser</p>
            <p className="mt-0.5 text-2xl font-bold text-ink">
              {formatFCFA(montant)}
            </p>
          </div>

          <Champ
            label="Moyen de paiement"
            htmlFor={`methode-${commandeId}`}
            requis
            erreurs={etat.erreurs?.methode}
          >
            <Select id={`methode-${commandeId}`} name="methode" required>
              <option value="ESPECES">Especes</option>
              <option value="WAVE">Wave</option>
              <option value="ORANGE_MONEY">Orange Money</option>
            </Select>
          </Champ>

          <Champ
            label="Reference"
            htmlFor={`reference-${commandeId}`}
            erreurs={etat.erreurs?.reference}
            aide="Numero de transaction Wave / Orange Money, ou de recu papier."
          >
            <Input
              id={`reference-${commandeId}`}
              name="reference"
              placeholder="Facultatif"
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Cette remise ecrit une ligne dans le journal de caisse. Elle
            apparaitra dans vos paiements et vos rapports.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
            >
              Retour
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? "Encaissement..." : "Confirmer l'encaissement"}
            </Button>
          </div>
        </form>
      </Modale>
    </>
  );
}
