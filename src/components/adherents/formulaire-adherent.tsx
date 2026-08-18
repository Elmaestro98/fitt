"use client";

// Composant client : il affiche l'etat "en cours d'envoi" et les erreurs
// renvoyees par le serveur. La validation, elle, reste entierement serveur.
import Link from "next/link";
import { useActionState } from "react";
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
import {
  actionCreerAdherent,
  type EtatFormulaire,
} from "@/lib/actions/adherent";

const ETAT_INITIAL: EtatFormulaire = {};

export function FormulaireAdherent() {
  // useActionState (React 19) relie le <form> a la Server Action :
  //   etat      -> ce que l'action a renvoye (erreurs, message)
  //   action    -> a passer a <form action={...}>
  //   enCours   -> true pendant l'aller-retour serveur
  const [etat, action, enCours] = useActionState(
    actionCreerAdherent,
    ETAT_INITIAL,
  );

  const e = etat.erreurs;

  return (
    <form action={action} className="space-y-5">
      {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

      <Card>
        <CardBody className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold text-ink">Identite</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Prenom" htmlFor="prenom" requis erreurs={e?.prenom}>
              <Input
                id="prenom"
                name="prenom"
                required
                autoComplete="given-name"
                placeholder="Moussa"
                invalide={Boolean(e?.prenom)}
              />
            </Champ>

            <Champ label="Nom" htmlFor="nom" requis erreurs={e?.nom}>
              <Input
                id="nom"
                name="nom"
                required
                autoComplete="family-name"
                placeholder="Diop"
                invalide={Boolean(e?.nom)}
              />
            </Champ>
          </div>

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
              <Input id="dateNaissance" name="dateNaissance" type="date" />
            </Champ>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold text-ink">Contact</h2>

          <Champ
            label="Telephone"
            htmlFor="telephone"
            requis
            erreurs={e?.telephone}
            aide="Format libre : 77 123 45 67 ou +221 77 123 45 67."
          >
            <Input
              id="telephone"
              name="telephone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="77 123 45 67"
              invalide={Boolean(e?.telephone)}
            />
          </Champ>

          <Champ label="E-mail" htmlFor="email" erreurs={e?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="moussa.diop@example.com"
              invalide={Boolean(e?.email)}
            />
          </Champ>

          <Champ label="Adresse" htmlFor="adresse" erreurs={e?.adresse}>
            <Input
              id="adresse"
              name="adresse"
              placeholder="Quartier Sor, Saint-Louis"
            />
          </Champ>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold text-ink">Notes</h2>
          <Champ
            label="Notes internes"
            htmlFor="notes"
            erreurs={e?.notes}
            aide="Visible par l'equipe uniquement. Preferences d'horaire, blessure signalee..."
          >
            <Textarea
              id="notes"
              name="notes"
              placeholder="Prefere les creneaux du matin."
            />
          </Champ>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/adherents">
          <Button type="button" variante="contour" className="w-full sm:w-auto">
            Annuler
          </Button>
        </Link>
        <Button type="submit" disabled={enCours} className="w-full sm:w-auto">
          {enCours && <Loader2 className="size-4 animate-spin" />}
          {enCours ? "Enregistrement..." : "Enregistrer l'adherent"}
        </Button>
      </div>

      <p className="text-xs text-muted">
        Le numero d&apos;adherent (FITT-0000) est attribue automatiquement.
        Enregistrer un adherent ne l&apos;invite pas : son espace mobile reste
        facultatif.
      </p>
    </form>
  );
}
