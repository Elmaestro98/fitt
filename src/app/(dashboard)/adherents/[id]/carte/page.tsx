import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CarteMembre } from "@/components/adherents/carte-membre";
import { CarteMembreVerso } from "@/components/adherents/carte-membre-verso";
import { BoutonImprimerCarte } from "@/components/adherents/bouton-imprimer-carte";
import { trouverAdherent } from "@/lib/data/adherent";
import { abonnementActuel } from "@/lib/data/abonnement";
import { parametresSalle } from "@/lib/data/gym";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adherent = await trouverAdherent(id);
  return {
    title: adherent
      ? `Carte membre — ${adherent.prenom} ${adherent.nom} — Fitt`
      : "Adherent introuvable — Fitt",
  };
}

export default async function PageCarteMembre({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // trouverAdherent filtre deja sur le gymId de la session (§3) : l'id d'un
  // adherent d'une autre salle renvoie null, donc un 404.
  const [adherent, gym] = await Promise.all([
    trouverAdherent(id),
    parametresSalle(),
  ]);
  if (!adherent) notFound();

  // Une fois seulement l'adherent confirme : inutile d'interroger les
  // abonnements d'un id qui va de toute facon renvoyer un 404.
  const abonnement = await abonnementActuel(adherent.id);

  return (
    <div className="space-y-6">
      {/* print:hidden : rien de tout ceci n'a sa place sur le papier. */}
      <div className="print:hidden">
        <Link
          href={`/adherents/${adherent.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ChevronLeft className="size-4" />
          Retour a la fiche
        </Link>
      </div>

      <PageHeader
        titre="Carte membre"
        sousTitre={`${adherent.prenom} ${adherent.nom} · ${adherent.numero}`}
        action={<BoutonImprimerCarte />}
        className="print:hidden"
      />

      {/* Sur ecran : recto et verso cote a cote, chacun etiquete. A
          l'impression : ni marge ni fond, juste les deux cartes a leur taille
          reelle (85,6 x 54 mm), l'une sous l'autre, pour tomber juste sur du
          papier carte pre-decoupe recto-verso. */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-4 sm:flex-row sm:justify-center print:m-0 print:max-w-none print:flex-col print:gap-4 print:p-0">
        <div className="flex flex-col items-center gap-2 print:items-start">
          <p className="text-xs font-medium text-muted print:hidden">Recto</p>
          <div className="w-full max-w-85 print:h-[53.98mm] print:w-[85.6mm]">
            <CarteMembre adherent={adherent} gym={gym} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 print:items-start">
          <p className="text-xs font-medium text-muted print:hidden">Verso</p>
          <div className="w-full max-w-85 print:h-[53.98mm] print:w-[85.6mm]">
            <CarteMembreVerso
              adherent={adherent}
              abonnement={abonnement}
              gym={gym}
            />
          </div>
        </div>
      </div>

      <p className="mx-auto max-w-sm text-center text-xs text-muted print:hidden">
        Format carte de credit standard (85,6 x 54 mm). Certaines imprimantes
        proposent &quot;Ajuster a la page&quot; dans la boite de dialogue
        d&apos;impression : preferez plutot &quot;Taille reelle&quot; pour
        garder les bonnes proportions — et pensez a activer les
        &quot;graphismes d&apos;arriere-plan&quot; pour imprimer en couleur.
      </p>
    </div>
  );
}
