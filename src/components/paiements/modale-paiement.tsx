"use client";

// Encaissement d'un paiement. Reprend la modale de paiement des maquettes.
//
// Le montant est pre-rempli avec ce qui reste du sur l'abonnement en cours,
// mais reste MODIFIABLE : un paiement partiel (10 000 sur 15 000) est un cas
// normal au Senegal, pas une erreur a corriger.
import { useActionState, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import { Modale } from "@/components/ui/modale";
import {
  actionEnregistrerPaiement,
  type EtatFormulaire,
} from "@/lib/actions/paiement";
import { formatFCFA } from "@/lib/utils/format";

const METHODES = [
  { valeur: "ESPECES", libelle: "Especes" },
  { valeur: "WAVE", libelle: "Wave" },
  { valeur: "ORANGE_MONEY", libelle: "Orange Money" },
] as const;

export type AbonnementAPayer = {
  id: string;
  nomFormule: string;
  reste: number;
};

/** "AAAA-MM-JJ" pour l'input date, en heure de Dakar (UTC+0). */
function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ModalePaiement({
  adherentId,
  nomAdherent,
  abonnement,
  variante = "primaire",
  taille = "md",
  libelle = "Encaisser un paiement",
}: {
  adherentId: string;
  nomAdherent: string;
  /** L'abonnement a solder, s'il y en a un en cours. */
  abonnement: AbonnementAPayer | null;
  variante?: "primaire" | "contour";
  taille?: "sm" | "md";
  libelle?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionEnregistrerPaiement.bind(null, adherentId),
    {},
  );

  // Un reste negatif signifie un trop-percu : on ne le propose pas comme
  // montant a encaisser.
  const reste = Math.max(0, abonnement?.reste ?? 0);
  const [montant, setMontant] = useState(String(reste || ""));
  const [methode, setMethode] = useState<string>("ESPECES");

  useEffect(() => {
    if (etat.succes) setOuvert(false);
  }, [etat.succes]);

  // A la reouverture, le formulaire repart du reste du a l'instant present :
  // il a pu changer depuis le premier rendu de la page.
  function ouvrir() {
    setMontant(String(reste || ""));
    setOuvert(true);
  }

  const saisi = Number(montant) || 0;
  const partiel = reste > 0 && saisi > 0 && saisi < reste;

  return (
    <>
      <Button
        type="button"
        variante={variante}
        taille={taille}
        onClick={ouvrir}
      >
        <Wallet className="size-4" />
        {libelle}
      </Button>

      <Modale
        ouvert={ouvert}
        onFermer={() => setOuvert(false)}
        titre="Encaisser un paiement"
        sousTitre={nomAdherent}
      >
        <form action={action} className="space-y-4">
          {abonnement && (
            <input
              type="hidden"
              name="abonnementId"
              value={abonnement.id}
            />
          )}

          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          {abonnement && (
            <div className="rounded-control bg-sunken px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Abonnement</span>
                <span className="font-medium text-ink">
                  {abonnement.nomFormule}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted">Reste a payer</span>
                <span className="font-semibold text-ink">
                  {formatFCFA(reste)}
                </span>
              </div>
            </div>
          )}

          <Champ
            label="Montant recu"
            htmlFor="montant"
            requis
            erreurs={etat.erreurs?.montant}
            aide="En FCFA, sans centimes."
          >
            <Input
              id="montant"
              name="montant"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              autoFocus
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              invalide={Boolean(etat.erreurs?.montant)}
            />
          </Champ>

          {partiel && (
            <p className="rounded-control bg-warning-soft px-3 py-2 text-xs text-warning">
              Paiement partiel : il restera {formatFCFA(reste - saisi)} a
              encaisser.
            </p>
          )}

          <Champ
            label="Methode"
            htmlFor="methode"
            requis
            erreurs={etat.erreurs?.methode}
          >
            <Select
              id="methode"
              name="methode"
              required
              value={methode}
              onChange={(e) => setMethode(e.target.value)}
            >
              {METHODES.map((m) => (
                <option key={m.valeur} value={m.valeur}>
                  {m.libelle}
                </option>
              ))}
            </Select>
          </Champ>

          {methode !== "ESPECES" && (
            <Champ
              label="Reference de la transaction"
              htmlFor="reference"
              erreurs={etat.erreurs?.reference}
              aide="Numero affiche par Wave ou Orange Money. Facultatif, mais precieux en cas de litige."
            >
              <Input
                id="reference"
                name="reference"
                placeholder="Ex. TX7F42K9"
                invalide={Boolean(etat.erreurs?.reference)}
              />
            </Champ>
          )}

          <Champ
            label="Date d'encaissement"
            htmlFor="encaisseLe"
            requis
            erreurs={etat.erreurs?.encaisseLe}
            aide="Le jour ou l'argent a ete recu, pas celui de la saisie."
          >
            <Input
              id="encaisseLe"
              name="encaisseLe"
              type="date"
              required
              defaultValue={aujourdhuiISO()}
              invalide={Boolean(etat.erreurs?.encaisseLe)}
            />
          </Champ>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Un paiement enregistre ne peut plus etre modifie ni supprime. En cas
            d&apos;erreur, il s&apos;annule avec un motif.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variante="contour"
              onClick={() => setOuvert(false)}
            >
              Retour
            </Button>
            {/* chargement : l'anneau tourne ET le bouton se bloque. Sur un
                 paiement, c'est ce blocage qui compte — un double appui a
                 l'accueil creerait deux ecritures en caisse. */}
            <Button type="submit" chargement={enCours}>
              Enregistrer le paiement
            </Button>
          </div>
        </form>
      </Modale>
    </>
  );
}
