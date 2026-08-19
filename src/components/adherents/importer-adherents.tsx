"use client";

// Assistant d'import CSV, en deux etapes visibles par le staff :
//   1. upload + analyse (actionApercuImportCSV) — RIEN n'est encore ecrit ;
//   2. apercu + confirmation (actionConfirmerImportCSV) — l'ecriture reelle.
// Deux useActionState distincts, un par Server Action : c'est le passage de
// l'un a l'autre qui fait office de "wizard", sans etat serveur intermediaire
// a gerer (les lignes validees voyagent dans un champ cache, revalidees
// avant ecriture cote serveur).
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { FileWarning, Loader2, TriangleAlert, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AlerteFormulaire } from "@/components/ui/form";
import {
  actionApercuImportCSV,
  actionConfirmerImportCSV,
  type EtatImport,
} from "@/lib/actions/adherent";
import { formaterTelephone } from "@/lib/utils/telephone";

const ETAT_INITIAL: EtatImport = {};

export function ImporterAdherents() {
  const [etatApercu, actionApercu, chargementApercu] = useActionState(
    actionApercuImportCSV,
    ETAT_INITIAL,
  );
  const [etatConfirm, actionConfirm, chargementConfirm] = useActionState(
    actionConfirmerImportCSV,
    ETAT_INITIAL,
  );

  const [etape, setEtape] = useState<"upload" | "apercu">("upload");

  // Un nouvel apercu (nouvelle reference d'objet a chaque dispatch) fait
  // avancer l'assistant a l'etape 2, meme apres un "choisir un autre fichier".
  useEffect(() => {
    if (etatApercu.apercu) setEtape("apercu");
  }, [etatApercu]);

  if (etape === "upload") {
    return (
      <form action={actionApercu} className="space-y-4">
        {etatApercu.message && (
          <AlerteFormulaire>{etatApercu.message}</AlerteFormulaire>
        )}

        <Card>
          <CardBody className="space-y-4 pt-5">
            <div>
              <label
                htmlFor="fichier"
                className="block text-sm font-medium text-ink"
              >
                Fichier CSV
              </label>
              <p className="mt-1 text-xs text-muted">
                Colonnes attendues : Prenom, Nom, Telephone (obligatoires),
                Email, Sexe, Date de naissance, Adresse (facultatifs). Le nom
                exact des colonnes est libre — accents et majuscules
                n&apos;ont pas d&apos;importance.
              </p>
            </div>
            <input
              id="fichier"
              name="fichier"
              type="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm text-ink file:mr-4 file:h-11 file:rounded-control file:border file:border-line file:bg-surface file:px-4 file:text-sm file:font-medium file:text-ink hover:file:bg-sunken"
            />
          </CardBody>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/adherents">
            <Button
              type="button"
              variante="contour"
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={chargementApercu}
            className="w-full sm:w-auto"
          >
            {chargementApercu ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {chargementApercu ? "Analyse..." : "Analyser le fichier"}
          </Button>
        </div>
      </form>
    );
  }

  const apercu = etatApercu.apercu!;
  const pluriel = (n: number) => (n > 1 ? "s" : "");

  return (
    <form action={actionConfirm} className="space-y-4">
      {etatConfirm.message && (
        <AlerteFormulaire>{etatConfirm.message}</AlerteFormulaire>
      )}

      <input
        type="hidden"
        name="lignes"
        value={JSON.stringify(apercu.valides.map((v) => v.donnees))}
      />

      <Card>
        <CardHeader
          titre={`${apercu.valides.length} adherent${pluriel(apercu.valides.length)} pret${pluriel(apercu.valides.length)} a importer`}
        />
        {apercu.valides.length > 0 && (
          <CardBody className="pt-0">
            <div className="max-h-64 overflow-y-auto rounded-control border border-line">
              <table className="w-full text-sm">
                <thead className="bg-sunken text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Ligne</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Adherent
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Telephone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apercu.valides.map((l) => (
                    <tr key={l.ligne} className="border-t border-line">
                      <td className="px-3 py-2 text-muted">{l.ligne}</td>
                      <td className="px-3 py-2 text-ink">{l.identifiant}</td>
                      <td className="px-3 py-2 text-muted">
                        {formaterTelephone(l.donnees.telephone!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        )}
      </Card>

      {apercu.doublonsEnBase > 0 && (
        <div className="flex items-start gap-2 rounded-control border border-line bg-sunken px-4 py-3 text-sm text-muted">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            {apercu.doublonsEnBase} ligne{pluriel(apercu.doublonsEnBase)}{" "}
            ignoree{pluriel(apercu.doublonsEnBase)} : un adherent de cette
            salle utilise deja ce numero de telephone.
          </p>
        </div>
      )}

      {apercu.erreurs.length > 0 && (
        <Card>
          <CardHeader
            titre={`${apercu.erreurs.length} ligne${pluriel(apercu.erreurs.length)} en erreur`}
            icone={<FileWarning className="size-4 text-danger" />}
          />
          <CardBody className="pt-0">
            <ul className="space-y-1.5 text-sm">
              {apercu.erreurs.map((e) => (
                <li key={e.ligne} className="text-danger">
                  Ligne {e.ligne} ({e.identifiant}) — {e.erreurs.join(" ")}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variante="contour"
          className="w-full sm:w-auto"
          onClick={() => setEtape("upload")}
        >
          Choisir un autre fichier
        </Button>
        <Button
          type="submit"
          disabled={chargementConfirm || apercu.valides.length === 0}
          className="w-full sm:w-auto"
        >
          {chargementConfirm && <Loader2 className="size-4 animate-spin" />}
          {chargementConfirm
            ? "Import en cours..."
            : `Importer ${apercu.valides.length} adherent${pluriel(apercu.valides.length)}`}
        </Button>
      </div>
    </form>
  );
}
