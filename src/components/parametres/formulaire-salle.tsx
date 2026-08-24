"use client";

// Coordonnees de la salle.
//
// Le NOM n'est pas ici : il appartient a l'organisation Clerk, qui le reecrit
// a chaque passage sur /salle/initialisation. Le rendre modifiable produirait
// une modification annulee silencieusement un jour ou l'autre. Il est affiche
// en lecture seule, avec l'indication de l'endroit ou le changer.
import { useActionState, useState } from "react";
import { Check, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input } from "@/components/ui/form";
import {
  actionModifierParametres,
  type EtatFormulaire,
} from "@/lib/actions/gym";
import { formaterTelephoneSalle } from "@/lib/utils/telephone";

/**
 * Choix du logo de la salle, avec apercu immediat.
 *
 * Meme composant que ChampPhoto (produit) et ChampPhotoAdherent (adherent),
 * adapte au logo : facultatif (sans logo, la carte membre retombe sur le
 * logo Fitt par defaut), format carre plutot que rond — un logo n'a pas la
 * meme geometrie qu'un portrait.
 */
function ChampLogoSalle({
  logoActuel,
  erreurs,
}: {
  logoActuel: string | null;
  erreurs?: string[];
}) {
  const [apercu, setApercu] = useState<string | null>(null);
  const [retirer, setRetirer] = useState(false);

  const image = apercu ?? (retirer ? null : logoActuel);

  return (
    <Champ
      label="Logo de la salle"
      htmlFor="logo"
      erreurs={erreurs}
      aide="Facultatif. Remplace le logo Fitt sur la carte membre. JPEG, PNG ou WEBP, 5 Mo maximum."
    >
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-sunken text-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-contain" />
          ) : (
            <ImageOff className="size-6" aria-hidden="true" />
          )}
        </span>

        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-invalid={Boolean(erreurs?.length) || undefined}
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            if (fichier) setRetirer(false);
            setApercu((precedent) => {
              if (precedent) URL.revokeObjectURL(precedent);
              return fichier ? URL.createObjectURL(fichier) : null;
            });
          }}
          className="block flex-1 text-sm text-ink file:mr-3 file:h-10 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:text-sm file:font-medium file:text-ink hover:file:bg-sunken"
        />
      </div>

      {logoActuel && !apercu && (
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="retirerLogo"
            checked={retirer}
            onChange={(e) => setRetirer(e.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Retirer le logo actuel
        </label>
      )}
    </Champ>
  );
}

export function FormulaireSalle({
  nom,
  telephone,
  adresse,
  ville,
  logoUrl,
  prefixeAdherent,
}: {
  nom: string;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  logoUrl: string | null;
  prefixeAdherent: string;
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

          <ChampLogoSalle logoActuel={logoUrl} erreurs={e?.logo} />

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

          <Champ
            label="Prefixe du matricule"
            htmlFor="prefixeAdherent"
            erreurs={e?.prefixeAdherent}
            aide="Devant chaque numero d'adherent, ex. POWERGYM-0042. Ne change que les PROCHAINS adherents crees, jamais les numeros deja attribues."
          >
            <Input
              id="prefixeAdherent"
              name="prefixeAdherent"
              defaultValue={prefixeAdherent}
              placeholder="FITT"
              maxLength={12}
              className="uppercase"
              invalide={Boolean(e?.prefixeAdherent)}
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
