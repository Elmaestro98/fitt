"use client";

// Coordonnees de la salle.
//
// Le NOM n'est pas ici : il appartient a l'organisation Clerk, qui le reecrit
// a chaque passage sur /salle/initialisation. Le rendre modifiable produirait
// une modification annulee silencieusement un jour ou l'autre. Il est affiche
// en lecture seule, avec l'indication de l'endroit ou le changer.
import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input } from "@/components/ui/form";
import {
  actionModifierParametres,
  type EtatFormulaire,
} from "@/lib/actions/gym";
import { formaterTelephoneSalle } from "@/lib/utils/telephone";

export function FormulaireSalle({
  nom,
  telephone,
  adresse,
  ville,
}: {
  nom: string;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
}) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionModifierParametres,
    {},
  );

  const e = etat.erreurs;

  return (
    <Card>
      <CardHeader titre="Coordonnees de la salle" />
      <CardBody>
        <form action={action} className="space-y-4">
          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          {etat.succes && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success"
            >
              <Check className="size-4" />
              Modifications enregistrees.
            </p>
          )}

          <Champ
            label="Nom de la salle"
            htmlFor="nom"
            aide="Gere dans votre organisation, via le selecteur de salle en haut de l'ecran. Il est repris automatiquement ici."
          >
            <Input id="nom" name="nom" defaultValue={nom} disabled readOnly />
          </Champ>

          <Champ
            label="Telephone"
            htmlFor="telephone"
            erreurs={e?.telephone}
            aide="Fixe ou mobile. Figurera sur les recus et les messages envoyes aux adherents."
          >
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              inputMode="tel"
              defaultValue={telephone ? formaterTelephoneSalle(telephone) : ""}
              placeholder="33 823 45 67"
              invalide={Boolean(e?.telephone)}
            />
          </Champ>

          <Champ label="Adresse" htmlFor="adresse" erreurs={e?.adresse}>
            <Input
              id="adresse"
              name="adresse"
              defaultValue={adresse ?? ""}
              placeholder="Quartier Nord, route de Ngallele"
              maxLength={200}
              invalide={Boolean(e?.adresse)}
            />
          </Champ>

          <Champ label="Ville" htmlFor="ville" erreurs={e?.ville}>
            <Input
              id="ville"
              name="ville"
              defaultValue={ville ?? ""}
              placeholder="Saint-Louis"
              maxLength={80}
              invalide={Boolean(e?.ville)}
            />
          </Champ>

          <Button type="submit" chargement={enCours}>
            Enregistrer
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
