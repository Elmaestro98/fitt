"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  AlerteFormulaire,
  Champ,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import type { EtatFormulaire } from "@/lib/actions/formule";
import { formatFCFA } from "@/lib/utils/format";
import { formaterDuree, type UniteDuree } from "@/lib/utils/duree";

const ETAT_INITIAL: EtatFormulaire = {};

export type ValeursFormule = {
  nom: string;
  description: string | null;
  prix: number;
  dureeValeur: number;
  dureeUnite: string;
  ordre: number;
};

export function FormulaireFormule({
  action: actionServeur,
  valeurs,
  libelleSoumission,
  avertissementPrix = false,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  valeurs?: ValeursFormule;
  libelleSoumission: string;
  avertissementPrix?: boolean;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  // Apercu vivant : le gerant voit "15 000 FCFA / 1 mois" pendant qu'il tape.
  const [prix, setPrix] = useState(String(valeurs?.prix ?? ""));
  const [duree, setDuree] = useState(String(valeurs?.dureeValeur ?? "1"));
  const [unite, setUnite] = useState<UniteDuree>(
    (valeurs?.dureeUnite as UniteDuree) ?? "MOIS",
  );

  const prixNum = Number(prix);
  const dureeNum = Number(duree);
  const apercuValide =
    Number.isInteger(prixNum) && prixNum >= 0 && dureeNum >= 1;

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <Champ label="Nom de la formule" htmlFor="nom" requis erreurs={e?.nom}>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={valeurs?.nom}
              placeholder="Premium Annuel"
              invalide={Boolean(e?.nom)}
            />
          </Champ>

          <Champ
            label="Description"
            htmlFor="description"
            erreurs={e?.description}
            aide="Visible par le gerant et sur la fiche de l'adherent."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={valeurs?.description ?? ""}
              placeholder="Acces total + cours collectifs"
              className="min-h-16"
            />
          </Champ>

          <Champ
            label="Prix"
            htmlFor="prix"
            requis
            erreurs={e?.prix}
            aide="En FCFA, sans centimes ni espaces."
          >
            <Input
              id="prix"
              name="prix"
              required
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={prix}
              onChange={(ev) => setPrix(ev.target.value)}
              placeholder="15000"
              invalide={Boolean(e?.prix)}
            />
          </Champ>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ
              label="Duree"
              htmlFor="dureeValeur"
              requis
              erreurs={e?.dureeValeur}
            >
              <Input
                id="dureeValeur"
                name="dureeValeur"
                required
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={duree}
                onChange={(ev) => setDuree(ev.target.value)}
                invalide={Boolean(e?.dureeValeur)}
              />
            </Champ>

            <Champ label="Unite" htmlFor="dureeUnite" requis erreurs={e?.dureeUnite}>
              <Select
                id="dureeUnite"
                name="dureeUnite"
                value={unite}
                onChange={(ev) => setUnite(ev.target.value as UniteDuree)}
              >
                <option value="JOUR">Jours</option>
                <option value="SEMAINE">Semaines</option>
                <option value="MOIS">Mois</option>
                <option value="ANNEE">Annees</option>
              </Select>
            </Champ>
          </div>

          <Champ
            label="Ordre d'affichage"
            htmlFor="ordre"
            erreurs={e?.ordre}
            aide="Les plus petits nombres apparaissent en premier."
          >
            <Input
              id="ordre"
              name="ordre"
              type="number"
              min={0}
              step={1}
              defaultValue={valeurs?.ordre ?? 0}
            />
          </Champ>

          {apercuValide && (
            <div className="rounded-control bg-sunken px-4 py-3">
              <p className="text-xs text-muted">Apercu</p>
              <p className="mt-0.5 text-ink">
                <span className="text-lg font-bold">{formatFCFA(prixNum)}</span>
                <span className="text-sm text-muted">
                  {" "}
                  / {formaterDuree(dureeNum, unite)}
                </span>
              </p>
            </div>
          )}

          {avertissementPrix && (
            <p className="rounded-control bg-warning-soft px-4 py-3 text-sm text-ink/80">
              Modifier cette formule ne change <strong>aucun</strong> abonnement
              deja souscrit : chacun a garde le tarif et la duree du jour de sa
              vente.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/formules">
          <Button type="button" variante="contour" className="w-full sm:w-auto">
            Annuler
          </Button>
        </Link>
        <Button type="submit" disabled={enCours} className="w-full sm:w-auto">
          {enCours && <Loader2 className="size-4 animate-spin" />}
          {enCours ? "Enregistrement..." : libelleSoumission}
        </Button>
      </div>
    </form>
  );
}
