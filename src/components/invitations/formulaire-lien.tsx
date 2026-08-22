"use client";

// Generation d'un lien de pre-inscription.
//
// /!\ Le lien produit n'est affiche QU'UNE FOIS (§9 : le jeton n'est pas
// stocke, seule son empreinte l'est). L'ecran le dit explicitement, et
// propose la copie avant toute autre action : un lien ferme est un lien perdu.
import { useActionState, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AlerteFormulaire, Champ, Input, Select } from "@/components/ui/form";
import { actionCreerLien, type EtatFormulaire } from "@/lib/actions/invitation";

const DUREES = [
  { valeur: "7", libelle: "7 jours (recommande)" },
  { valeur: "1", libelle: "24 heures" },
  { valeur: "30", libelle: "30 jours" },
  { valeur: "90", libelle: "90 jours" },
] as const;

const USAGES = [
  { valeur: "1", libelle: "1 personne" },
  { valeur: "25", libelle: "25 personnes" },
  { valeur: "0", libelle: "Sans limite (affiche, QR a l'accueil)" },
] as const;

export function FormulaireLien() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(
    actionCreerLien,
    {},
  );

  if (etat.succes && etat.lien) {
    return <LienGenere lien={etat.lien} />;
  }

  return (
    <Card>
      <CardHeader
        titre="Generer un lien d'inscription"
        icone={<Link2 className="size-4 text-brand" />}
      />
      <CardBody>
        <form action={action} className="space-y-4">
          {etat.message && <AlerteFormulaire>{etat.message}</AlerteFormulaire>}

          <Champ
            label="Nom du lien"
            htmlFor="libelle"
            requis
            erreurs={etat.erreurs?.libelle}
            aide="Pour vous y retrouver plus tard. Exemple : Affiche accueil, Rentree septembre."
          >
            <Input
              id="libelle"
              name="libelle"
              required
              maxLength={60}
              placeholder="Affiche accueil"
              invalide={Boolean(etat.erreurs?.libelle)}
            />
          </Champ>

          <div className="grid gap-4 sm:grid-cols-2">
            <Champ
              label="Valide pendant"
              htmlFor="jours"
              erreurs={etat.erreurs?.jours}
            >
              <Select id="jours" name="jours" defaultValue="7">
                {DUREES.map((d) => (
                  <option key={d.valeur} value={d.valeur}>
                    {d.libelle}
                  </option>
                ))}
              </Select>
            </Champ>

            <Champ
              label="Utilisable par"
              htmlFor="usagesMax"
              erreurs={etat.erreurs?.usagesMax}
              aide="Un lien sans limite peut etre imprime et affiche."
            >
              <Select id="usagesMax" name="usagesMax" defaultValue="1">
                {USAGES.map((u) => (
                  <option key={u.valeur} value={u.valeur}>
                    {u.libelle}
                  </option>
                ))}
              </Select>
            </Champ>
          </div>

          <p className="rounded-control bg-sunken px-3 py-2 text-xs text-muted">
            Les personnes inscrites par ce lien arrivent en{" "}
            <strong className="font-medium text-ink">attente de validation</strong>.
            Elles ne comptent comme adherentes qu&apos;une fois validees par
            votre equipe.
          </p>

          <Button type="submit" chargement={enCours}>
            Generer le lien
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function LienGenere({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      // Presse-papiers refuse (contexte non securise, permission) : le lien
      // reste selectionnable a la main dans le champ.
    }
  }

  return (
    <Card className="border-success/40">
      <CardHeader
        titre="Lien genere"
        icone={<Check className="size-4 text-success" />}
      />
      <CardBody className="space-y-4">
        <div className="rounded-control border border-warning/40 bg-warning-soft px-4 py-3">
          <p className="text-sm font-medium text-ink">
            Copiez-le maintenant.
          </p>
          <p className="mt-1 text-xs text-muted">
            Ce lien ne sera plus jamais affiche : nous n&apos;en gardons
            qu&apos;une empreinte chiffree, pour qu&apos;un acces a la base ne
            puisse ouvrir aucune inscription. Si vous le perdez, generez-en un
            nouveau.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={lien}
            aria-label="Lien d'inscription"
            onFocus={(e) => e.currentTarget.select()}
            className="h-11 w-full flex-1 rounded-control border border-line bg-sunken px-3 font-mono text-xs text-ink focus:border-brand focus:outline-none"
          />
          <Button type="button" onClick={copier} className="shrink-0">
            {copie ? (
              <>
                <Check className="size-4" />
                Copie
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copier
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted">
          Partagez-le par WhatsApp, ou imprimez-le en QR code pour l&apos;afficher
          a l&apos;accueil.
        </p>
      </CardBody>
    </Card>
  );
}
