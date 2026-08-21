"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Textarea } from "@/components/ui/form";
import type { EtatFormulaire } from "@/lib/actions/type-cours";

const ETAT_INITIAL: EtatFormulaire = {};

export type ValeursTypeCours = {
  nom: string;
  description: string | null;
  couleur: string | null;
  dureeMinutes: number;
  capaciteDefaut: number;
  ordre: number;
};

export function FormulaireTypeCours({
  action: actionServeur,
  valeurs,
  libelleSoumission,
  avertissement = false,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  valeurs?: ValeursTypeCours;
  libelleSoumission: string;
  avertissement?: boolean;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  const [couleur, setCouleur] = useState(valeurs?.couleur ?? "#FF6B35");

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <Champ label="Nom du type de cours" htmlFor="nom" requis erreurs={e?.nom}>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={valeurs?.nom}
              placeholder="Yoga"
              invalide={Boolean(e?.nom)}
            />
          </Champ>

          <Champ
            label="Description"
            htmlFor="description"
            erreurs={e?.description}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={valeurs?.description ?? ""}
              placeholder="Seance douce, tapis fourni"
              className="min-h-16"
            />
          </Champ>

          <Champ
            label="Couleur"
            htmlFor="couleur"
            erreurs={e?.couleur}
            aide="Utilisee pour reperer le type de cours dans le planning."
          >
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(ev) => setCouleur(ev.target.value)}
                className="size-10 cursor-pointer rounded-control border border-line"
                aria-label="Choisir une couleur"
              />
              <Input
                id="couleur"
                name="couleur"
                value={couleur}
                onChange={(ev) => setCouleur(ev.target.value)}
                placeholder="#FF6B35"
                className="max-w-32"
                invalide={Boolean(e?.couleur)}
              />
            </div>
          </Champ>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ
              label="Duree (minutes)"
              htmlFor="dureeMinutes"
              requis
              erreurs={e?.dureeMinutes}
            >
              <Input
                id="dureeMinutes"
                name="dureeMinutes"
                required
                type="number"
                min={10}
                step={5}
                inputMode="numeric"
                defaultValue={valeurs?.dureeMinutes ?? 60}
                invalide={Boolean(e?.dureeMinutes)}
              />
            </Champ>

            <Champ
              label="Capacite par defaut"
              htmlFor="capaciteDefaut"
              requis
              erreurs={e?.capaciteDefaut}
            >
              <Input
                id="capaciteDefaut"
                name="capaciteDefaut"
                required
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                defaultValue={valeurs?.capaciteDefaut ?? 15}
                invalide={Boolean(e?.capaciteDefaut)}
              />
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

          {avertissement && (
            <p className="rounded-control bg-warning-soft px-4 py-3 text-sm text-ink/80">
              Modifier la duree ou la capacite par defaut ne change{" "}
              <strong>aucune</strong> seance deja programmee : chacune a garde
              les valeurs du jour de sa creation.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/cours/types-cours">
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
