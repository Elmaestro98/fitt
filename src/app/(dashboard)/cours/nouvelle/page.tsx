import Link from "next/link";
import { ChevronLeft, Dumbbell, Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireSession } from "@/components/cours/formulaire-session";
import { actionCreerSessionCours } from "@/lib/actions/session-cours";
import { listerCoachs } from "@/lib/data/coach";
import { listerTypesCours } from "@/lib/data/type-cours";

export const metadata = { title: "Nouvelle seance — Fitt" };

export default async function PageNouvelleSession() {
  const [typesCours, coachs] = await Promise.all([
    listerTypesCours(),
    listerCoachs(),
  ]);

  const retour = (
    <Link
      href="/cours"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <ChevronLeft className="size-4" />
      Retour au planning
    </Link>
  );

  // Une seance a besoin d'un type de cours ET d'un coach : sans l'un des
  // deux, le formulaire n'a rien a proposer. On guide vers l'etape
  // manquante plutot que d'afficher un select vide.
  if (typesCours.length === 0 || coachs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {retour}
        <PageHeader titre="Nouvelle seance" />
        <Card>
          <EmptyState
            icone={
              typesCours.length === 0 ? (
                <Palette className="size-5" />
              ) : (
                <Dumbbell className="size-5" />
              )
            }
            titre={
              typesCours.length === 0
                ? "Aucun type de cours"
                : "Aucun coach"
            }
            description={
              typesCours.length === 0
                ? "Creez d'abord un type de cours (Yoga, Cross-training...) avant de programmer une seance."
                : "Creez d'abord un coach avant de programmer une seance."
            }
            action={
              <Link
                href={
                  typesCours.length === 0
                    ? "/cours/types-cours/nouveau"
                    : "/cours/coachs/nouveau"
                }
              >
                <Button>
                  <Plus className="size-4" />
                  {typesCours.length === 0
                    ? "Nouveau type de cours"
                    : "Nouveau coach"}
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {retour}

      <PageHeader
        titre="Nouvelle seance"
        sousTitre="La duree et la capacite du type de cours sont proposees par defaut, modifiables au cas par cas."
      />

      <FormulaireSession
        action={actionCreerSessionCours}
        typesCours={typesCours}
        coachs={coachs}
      />
    </div>
  );
}
