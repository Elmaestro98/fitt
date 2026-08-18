"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import type { EtatFormulaire } from "@/lib/actions/abonnement";
import { formatFCFA, formatDateLongue } from "@/lib/utils/format";
import { ajouterDuree, formaterDuree, type UniteDuree } from "@/lib/utils/duree";

const ETAT_INITIAL: EtatFormulaire = {};

export type OptionFormule = {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  dureeValeur: number;
  dureeUnite: string;
};

export function FormulaireSouscription({
  action: actionServeur,
  formules,
  debutPropose,
  prolongation,
  hrefAnnuler,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  formules: OptionFormule[];
  /** "AAAA-MM-JJ" */
  debutPropose: string;
  /** true si l'adherent a encore un abonnement valide. */
  prolongation: boolean;
  hrefAnnuler: string;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  const [formuleId, setFormuleId] = useState(formules[0]?.id ?? "");
  const [debut, setDebut] = useState(debutPropose);

  const choisie = formules.find((f) => f.id === formuleId);

  // Apercu calcule dans le navigateur, avec EXACTEMENT la meme fonction que
  // le serveur. Ce que le gerant lit ici est ce qui sera enregistre.
  const fin =
    choisie && debut
      ? ajouterDuree(
          new Date(debut + "T00:00:00.000Z"),
          choisie.dureeValeur,
          choisie.dureeUnite as UniteDuree,
        )
      : null;

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <Champ label="Formule" htmlFor="formuleId" requis erreurs={e?.formuleId}>
            <Select
              id="formuleId"
              name="formuleId"
              required
              value={formuleId}
              onChange={(ev) => setFormuleId(ev.target.value)}
            >
              {formules.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} — {formatFCFA(f.prix)} /{" "}
                  {formaterDuree(f.dureeValeur, f.dureeUnite as UniteDuree)}
                </option>
              ))}
            </Select>
          </Champ>

          {choisie?.description && (
            <p className="text-sm text-muted">{choisie.description}</p>
          )}

          <Champ
            label="Date de debut"
            htmlFor="debutLe"
            requis
            erreurs={e?.debutLe}
            aide={
              prolongation
                ? "Propose a la fin de l'abonnement en cours, pour ne perdre aucun jour deja paye."
                : undefined
            }
          >
            <Input
              id="debutLe"
              name="debutLe"
              type="date"
              required
              value={debut}
              onChange={(ev) => setDebut(ev.target.value)}
              invalide={Boolean(e?.debutLe)}
            />
          </Champ>

          {choisie && fin && (
            <div className="rounded-control bg-sunken px-4 py-3">
              <p className="text-xs text-muted">Recapitulatif</p>
              <dl className="mt-2 space-y-1 text-sm">
                <Ligne label="Formule" valeur={choisie.nom} />
                <Ligne
                  label="Montant a encaisser"
                  valeur={formatFCFA(choisie.prix)}
                  fort
                />
                <Ligne
                  label="Debut"
                  valeur={formatDateLongue(new Date(debut + "T00:00:00.000Z"))}
                />
                <Ligne label="Fin" valeur={formatDateLongue(fin)} fort />
              </dl>
              <p className="mt-3 text-xs text-muted">
                Ce nom, ce montant et cette date de fin seront figes : une
                modification ulterieure de la formule ne les changera pas.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={hrefAnnuler}>
          <Button type="button" variante="contour" className="w-full sm:w-auto">
            Annuler
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={enCours || !choisie}
          className="w-full sm:w-auto"
        >
          {enCours && <Loader2 className="size-4 animate-spin" />}
          {enCours ? "Enregistrement..." : "Souscrire l'abonnement"}
        </Button>
      </div>
    </form>
  );
}

function Ligne({
  label,
  valeur,
  fort = false,
}: {
  label: string;
  valeur: string;
  fort?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={fort ? "font-semibold text-ink" : "text-ink"}>{valeur}</dd>
    </div>
  );
}
