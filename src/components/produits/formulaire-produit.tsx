"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Textarea } from "@/components/ui/form";
import type { EtatFormulaireProduit } from "@/lib/actions/produit";
import { formatFCFA } from "@/lib/utils/format";

const ETAT_INITIAL: EtatFormulaireProduit = {};

export type ValeursProduit = {
  nom: string;
  description: string | null;
  prix: number;
  photoUrl: string | null;
  ordre: number;
};

/**
 * Choix de la photo, avec apercu immediat.
 *
 * La photo est FACULTATIVE : le catalogue affiche une icone par defaut, et
 * une salle qui saisit vingt produits au comptoir ne les photographiera pas
 * tous. C'est le cas normal, pas un cas d'erreur.
 */
function ChampPhoto({
  photoActuelle,
  erreurs,
}: {
  photoActuelle: string | null;
  erreurs?: string[];
}) {
  const [apercu, setApercu] = useState<string | null>(null);
  const [retirer, setRetirer] = useState(false);

  // L'apercu local prime sur la photo enregistree : le gerant qui vient de
  // choisir un fichier doit voir CE fichier, pas l'ancien.
  const image = apercu ?? (retirer ? null : photoActuelle);

  return (
    <Champ
      label="Photo"
      htmlFor="photo"
      erreurs={erreurs}
      aide="Facultative. JPEG, PNG ou WEBP, 5 Mo maximum."
    >
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-control bg-sunken text-muted">
          {image ? (
            // Apercu local avant envoi : une <img> ordinaire suffit,
            // next/image n'optimise pas une blob: URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            <Package className="size-6" aria-hidden="true" />
          )}
        </span>

        <input
          id="photo"
          name="photo"
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

      {/* Sans cette case, une photo posee par erreur ne pourrait plus jamais
          etre enlevee : ne rien envoyer signifie "ne pas y toucher". */}
      {photoActuelle && !apercu && (
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="retirerPhoto"
            checked={retirer}
            onChange={(e) => setRetirer(e.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Retirer la photo actuelle
        </label>
      )}
    </Champ>
  );
}

export function FormulaireProduit({
  action: actionServeur,
  valeurs,
  libelleSoumission,
  avertissementPrix = false,
}: {
  action: (
    etat: EtatFormulaireProduit,
    formData: FormData,
  ) => Promise<EtatFormulaireProduit>;
  valeurs?: ValeursProduit;
  libelleSoumission: string;
  avertissementPrix?: boolean;
}) {
  const [etat, action, enCours] = useActionState(actionServeur, ETAT_INITIAL);
  const e = etat.erreurs;

  // Apercu vivant : le gerant voit "15 000 FCFA" pendant qu'il tape.
  const [prix, setPrix] = useState(String(valeurs?.prix ?? ""));
  const prixNum = Number(prix);
  const apercuValide = Number.isInteger(prixNum) && prixNum >= 0 && prix !== "";

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <Champ label="Nom du produit" htmlFor="nom" requis erreurs={e?.nom}>
            <Input
              id="nom"
              name="nom"
              required
              defaultValue={valeurs?.nom}
              placeholder="Shaker Fitt"
              invalide={Boolean(e?.nom)}
            />
          </Champ>

          <Champ
            label="Description"
            htmlFor="description"
            erreurs={e?.description}
            aide="Visible par l'adherent dans la boutique."
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={valeurs?.description ?? ""}
              placeholder="Bouteille shaker 600 ml, sans BPA"
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
              placeholder="3000"
              invalide={Boolean(e?.prix)}
            />
          </Champ>

          <ChampPhoto
            photoActuelle={valeurs?.photoUrl ?? null}
            erreurs={e?.photo}
          />

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
              <p className="mt-0.5 text-lg font-bold text-ink">
                {formatFCFA(prixNum)}
              </p>
            </div>
          )}

          {avertissementPrix && (
            <p className="rounded-control bg-warning-soft px-4 py-3 text-sm text-ink/80">
              Modifier ce produit ne change <strong>aucune</strong> commande
              deja passee : chacune a garde le nom et le prix du jour de la
              vente.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/boutique">
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
