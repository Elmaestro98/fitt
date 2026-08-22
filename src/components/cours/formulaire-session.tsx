"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import type { EtatFormulaire } from "@/lib/actions/session-cours";

const ETAT_INITIAL: EtatFormulaire = {};

type TypeCoursOption = {
  id: string;
  nom: string;
  dureeMinutes: number;
  capaciteDefaut: number;
};

type CoachOption = {
  id: string;
  prenom: string;
  nom: string;
};

export type ValeursSession = {
  typeCoursId: string;
  coachId: string;
  debutLe: Date;
  dureeMinutes: number;
  capacite: number;
};

/** "2026-08-25T18:00" — Dakar est a UTC+0, pas de conversion de fuseau. */
function versDatetimeLocal(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export function FormulaireSession({
  action: actionServeur,
  typesCours,
  coachs,
  valeurs,
  libelleSoumission = "Programmer la seance",
  placesReserveesMin = 0,
  lienRetour = "/cours",
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  typesCours: TypeCoursOption[];
  coachs: CoachOption[];
  valeurs?: ValeursSession;
  libelleSoumission?: string;
  /** Sur une modification, la capacite ne peut pas descendre en dessous. */
  placesReserveesMin?: number;
  lienRetour?: string;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  const [typeCoursId, setTypeCoursId] = useState(
    valeurs?.typeCoursId ?? typesCours[0]?.id ?? "",
  );
  const [dureeMinutes, setDureeMinutes] = useState(
    String(valeurs?.dureeMinutes ?? typesCours[0]?.dureeMinutes ?? 60),
  );
  const [capacite, setCapacite] = useState(
    String(valeurs?.capacite ?? typesCours[0]?.capaciteDefaut ?? 15),
  );

  // Choisir un type de cours propose sa duree et sa capacite par defaut :
  // le staff peut ensuite les ajuster au cas par cas (une salle plus petite
  // ce jour-la, un remplacant qui prefere une seance plus courte...).
  function surChangementType(id: string) {
    setTypeCoursId(id);
    const type = typesCours.find((t) => t.id === id);
    if (type) {
      setDureeMinutes(String(type.dureeMinutes));
      setCapacite(String(type.capaciteDefaut));
    }
  }

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <Champ
            label="Type de cours"
            htmlFor="typeCoursId"
            requis
            erreurs={e?.typeCoursId}
          >
            <Select
              id="typeCoursId"
              name="typeCoursId"
              value={typeCoursId}
              onChange={(ev) => surChangementType(ev.target.value)}
              invalide={Boolean(e?.typeCoursId)}
            >
              {typesCours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </Select>
          </Champ>

          <Champ label="Coach" htmlFor="coachId" requis erreurs={e?.coachId}>
            <Select
              id="coachId"
              name="coachId"
              defaultValue={valeurs?.coachId}
              invalide={Boolean(e?.coachId)}
            >
              {coachs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </Select>
          </Champ>

          <Champ
            label="Date et heure"
            htmlFor="debutLe"
            requis
            erreurs={e?.debutLe}
          >
            <Input
              id="debutLe"
              name="debutLe"
              required
              type="datetime-local"
              defaultValue={valeurs ? versDatetimeLocal(valeurs.debutLe) : undefined}
              invalide={Boolean(e?.debutLe)}
            />
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
                value={dureeMinutes}
                onChange={(ev) => setDureeMinutes(ev.target.value)}
                invalide={Boolean(e?.dureeMinutes)}
              />
            </Champ>

            <Champ
              label="Capacite"
              htmlFor="capacite"
              requis
              erreurs={e?.capacite}
              aide={
                placesReserveesMin > 0
                  ? `Au moins ${placesReserveesMin} : des adherents sont deja inscrits.`
                  : undefined
              }
            >
              <Input
                id="capacite"
                name="capacite"
                required
                type="number"
                min={Math.max(1, placesReserveesMin)}
                step={1}
                inputMode="numeric"
                value={capacite}
                onChange={(ev) => setCapacite(ev.target.value)}
                invalide={Boolean(e?.capacite)}
              />
            </Champ>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={lienRetour}>
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
