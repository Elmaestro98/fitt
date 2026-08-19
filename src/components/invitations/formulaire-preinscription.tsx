"use client";

// Formulaire public de pre-inscription.
//
// Rempli par l'adherent lui-meme, sur son telephone, sans compte. Il ne cree
// PAS un acces (§4, §5) : il depose une demande que la salle validera.
// L'ecran le dit, pour que personne ne reparte en croyant etre inscrit.
import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import {
  actionPreinscription,
  type EtatPreinscription,
} from "@/lib/actions/invitation";

/**
 * Selecteur de photo avec apercu immediat : quelqu'un qui envoie une photo
 * de profil pour la premiere fois veut voir ce qu'il envoie avant de valider,
 * surtout depuis l'appareil photo d'un telephone (cadrage, luminosite).
 */
function ChampPhoto({ erreurs }: { erreurs?: string[] }) {
  const [apercu, setApercu] = useState<string | null>(null);

  return (
    <Champ
      label="Photo de profil"
      htmlFor="photo"
      requis
      erreurs={erreurs}
      aide="Pour que l'equipe de la salle vous reconnaisse a l'accueil."
    >
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sunken text-muted">
          {apercu ? (
            // Apercu local avant envoi : une image <img> ordinaire suffit,
            // next/image n'optimise pas une blob: URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apercu} alt="" className="size-full object-cover" />
          ) : (
            <UserRound className="size-6" aria-hidden="true" />
          )}
        </span>

        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          required
          aria-invalid={Boolean(erreurs?.length) || undefined}
          onChange={(e) => {
            const fichier = e.target.files?.[0];
            setApercu((precedent) => {
              if (precedent) URL.revokeObjectURL(precedent);
              return fichier ? URL.createObjectURL(fichier) : null;
            });
          }}
          className="block flex-1 text-sm text-ink file:mr-3 file:h-10 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:text-sm file:font-medium file:text-ink hover:file:bg-sunken"
        />
      </div>
    </Champ>
  );
}

export function FormulairePreinscription({
  jeton,
  nomSalle,
}: {
  jeton: string;
  nomSalle: string;
}) {
  const [etat, action, enCours] = useActionState<EtatPreinscription, FormData>(
    actionPreinscription.bind(null, jeton),
    {},
  );

  if (etat.succes) {
    return <Confirmation prenom={etat.prenom} nomSalle={nomSalle} />;
  }

  // Le lien est mort entre l'affichage et l'envoi : inutile de reproposer le
  // formulaire, la saisie ne pourra plus aboutir.
  if (etat.lienMort) {
    return (
      <Card>
        <CardBody className="pt-6 text-center">
          <h1 className="font-semibold text-ink">Lien expire</h1>
          <p className="mt-2 text-sm text-muted">{etat.message}</p>
        </CardBody>
      </Card>
    );
  }

  const e = etat.erreurs;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-ink">Rejoindre {nomSalle}</h1>
        <p className="mt-1 text-sm text-muted">
          Renseignez vos informations. L&apos;equipe de la salle validera votre
          inscription.
        </p>
      </div>

      <Card>
        <CardBody className="pt-5">
          <form action={action} className="space-y-4">
            {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

            <ChampPhoto erreurs={e?.photo} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Champ label="Prenom" htmlFor="prenom" requis erreurs={e?.prenom}>
                <Input
                  id="prenom"
                  name="prenom"
                  required
                  autoComplete="given-name"
                  invalide={Boolean(e?.prenom)}
                />
              </Champ>

              <Champ label="Nom" htmlFor="nom" requis erreurs={e?.nom}>
                <Input
                  id="nom"
                  name="nom"
                  required
                  autoComplete="family-name"
                  invalide={Boolean(e?.nom)}
                />
              </Champ>
            </div>

            <Champ
              label="Telephone"
              htmlFor="telephone"
              requis
              erreurs={e?.telephone}
              aide="C'est ce numero qui vous identifiera a la salle."
            >
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                placeholder="77 123 45 67"
                invalide={Boolean(e?.telephone)}
              />
            </Champ>

            <Champ
              label="Adresse e-mail"
              htmlFor="email"
              erreurs={e?.email}
              aide="Facultatif."
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                invalide={Boolean(e?.email)}
              />
            </Champ>

            <div className="grid gap-4 sm:grid-cols-2">
              <Champ label="Sexe" htmlFor="sexe" erreurs={e?.sexe}>
                <Select id="sexe" name="sexe" defaultValue="">
                  <option value="">Non precise</option>
                  <option value="HOMME">Homme</option>
                  <option value="FEMME">Femme</option>
                </Select>
              </Champ>

              <Champ
                label="Date de naissance"
                htmlFor="dateNaissance"
                erreurs={e?.dateNaissance}
              >
                <Input
                  id="dateNaissance"
                  name="dateNaissance"
                  type="date"
                  invalide={Boolean(e?.dateNaissance)}
                />
              </Champ>
            </div>

            <Button type="submit" disabled={enCours} className="w-full">
              {enCours && <Loader2 className="size-4 animate-spin" />}
              {enCours ? "Envoi..." : "Envoyer ma demande"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="px-2 text-center text-xs text-muted">
        Vos informations sont transmises uniquement a {nomSalle}. Aucun mot de
        passe ne vous est demande.
      </p>
    </div>
  );
}

function Confirmation({
  prenom,
  nomSalle,
}: {
  prenom?: string;
  nomSalle: string;
}) {
  return (
    <Card className="border-success/40">
      <CardBody className="pt-8 pb-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" />
        </span>

        <h1 className="mt-4 text-xl font-bold text-ink">
          C&apos;est envoye{prenom ? `, ${prenom}` : ""}&nbsp;!
        </h1>

        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Votre demande est arrivee a {nomSalle}. Presentez-vous a l&apos;accueil
          pour la finaliser : l&apos;equipe validera votre inscription et vous
          proposera une formule.
        </p>

        {/* On n'affiche pas de numero d'adherent : tant que le staff n'a pas
            valide, cette personne n'est pas adherente (§4). Lui donner un
            numero maintenant lui ferait croire le contraire. */}
      </CardBody>
    </Card>
  );
}
