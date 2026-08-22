"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input } from "@/components/ui/form";
import type { EtatFormulaire } from "@/lib/actions/coach";

const ETAT_INITIAL: EtatFormulaire = {};

export type ValeursCoach = {
  prenom: string;
  nom: string;
  telephone: string | null;
  specialite: string | null;
};

export function FormulaireCoach({
  action: actionServeur,
  valeurs,
  libelleSoumission,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  valeurs?: ValeursCoach;
  libelleSoumission: string;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prenom" htmlFor="prenom" requis erreurs={e?.prenom}>
              <Input
                id="prenom"
                name="prenom"
                required
                defaultValue={valeurs?.prenom}
                placeholder="Awa"
                invalide={Boolean(e?.prenom)}
              />
            </Champ>

            <Champ label="Nom" htmlFor="nom" requis erreurs={e?.nom}>
              <Input
                id="nom"
                name="nom"
                required
                defaultValue={valeurs?.nom}
                placeholder="Ndiaye"
                invalide={Boolean(e?.nom)}
              />
            </Champ>
          </div>

          <Champ
            label="Telephone"
            htmlFor="telephone"
            erreurs={e?.telephone}
            aide="Facultatif. Format senegalais : 77 123 45 67."
          >
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              defaultValue={valeurs?.telephone ?? ""}
              placeholder="77 123 45 67"
              invalide={Boolean(e?.telephone)}
            />
          </Champ>

          <Champ
            label="Specialite"
            htmlFor="specialite"
            erreurs={e?.specialite}
            aide="Visible sur la fiche du coach et dans le planning."
          >
            <Input
              id="specialite"
              name="specialite"
              defaultValue={valeurs?.specialite ?? ""}
              placeholder="Yoga, Cross-training"
              invalide={Boolean(e?.specialite)}
            />
          </Champ>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/cours/coachs">
          <Button type="button" variante="contour" className="w-full sm:w-auto">
            Annuler
          </Button>
        </Link>
        <Button type="submit" chargement={enCours} className="w-full sm:w-auto">
          {libelleSoumission}
        </Button>
      </div>
    </form>
  );
}
