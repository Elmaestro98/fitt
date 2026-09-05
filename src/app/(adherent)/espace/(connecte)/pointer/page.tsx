// Auto-pointage : l'adherent signale sa presence avec le code affiche a
// l'accueil.
//
// /!\ Le code n'est PAS une securite d'acces — il ne protege aucune donnee.
// Il atteste d'une seule chose : la personne a vu l'ecran de la borne, donc
// elle est dans la salle. C'est ce qui separe un registre de presence credible
// d'une liste de declarations faites depuis le canape.
import { MapPin } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FormulairePointage } from "@/components/espace/formulaire-pointage";
import { accueilEspace } from "@/lib/data/espace";
import { formatDateHeure } from "@/lib/utils/format";

export const metadata = { title: "Signaler ma presence — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

/* Le code arrive du QR affiche a l'accueil (?code=1234). On ne garde que
   quatre chiffres : tout le reste est ecarte ici, et de toute facon
   revalide cote serveur avant la moindre ecriture. */
function codeDeLUrl(valeur: string | string[] | undefined): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const chiffres = valeur.replace(/\D/g, "");
  return chiffres.length === 4 ? chiffres : undefined;
}

export default async function PagePointer({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [{ gym, dejaPointeAujourdhui, derniereSeance }, params] =
    await Promise.all([accueilEspace(), searchParams]);

  const codeScanne = codeDeLUrl(params.code);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Signaler ma presence"
        sousTitre={`Vous etes a ${gym.nom}`}
      />

      {dejaPointeAujourdhui && derniereSeance && (
        <div className="rounded-card border border-success/40 bg-success-soft px-4 py-3">
          <p className="text-sm font-medium text-ink">
            Vous avez deja pointe aujourd&apos;hui
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Enregistre le {formatDateHeure(derniereSeance)}. Un second pointage
            le meme jour ne compte pas double.
          </p>
        </div>
      )}

      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardBody className="space-y-5 py-8">
            <div className="text-center">
              <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-brand-soft">
                <MapPin className="size-5 text-brand" />
              </span>
              <p className="text-sm font-medium text-ink">
                {codeScanne
                  ? "Confirmez votre presence"
                  : "Saisissez le code du jour"}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
                {codeScanne
                  ? "Le code scanne est deja rempli. Un appui, et votre venue est enregistree."
                  : "Il est affiche a l'accueil de la salle et change chaque jour."}
              </p>
            </div>

            <FormulairePointage codePreRempli={codeScanne} />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Vous n&apos;avez pas trouve le code ? Demandez-le a l&apos;accueil :
          ce pointage n&apos;est possible que sur place.
        </p>
      </div>
    </div>
  );
}
