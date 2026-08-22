import Link from "next/link";
import { Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CarteTypeCours } from "@/components/types-cours/carte-type-cours";
import { listerTypesCours } from "@/lib/data/type-cours";

export const metadata = { title: "Types de cours — Fitt" };

export default async function PageTypesCours() {
  // On affiche aussi les archives : le gerant doit pouvoir les retrouver et
  // les reactiver, et comprendre pourquoi une ancienne seance les cite.
  const typesCours = await listerTypesCours({ inclureArchives: true });
  const actifs = typesCours.filter((t) => t.actif).length;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Types de cours"
        sousTitre={
          typesCours.length === 0
            ? "Le catalogue des seances proposees par votre salle"
            : `${actifs} type${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""} sur ${typesCours.length}`
        }
        action={
          <Link href="/cours/types-cours/nouveau">
            <Button>
              <Plus className="size-4" />
              Nouveau type
            </Button>
          </Link>
        }
      />

      {typesCours.length === 0 ? (
        <Card>
          <EmptyState
            icone={<Palette className="size-5" />}
            titre="Aucun type de cours"
            description="Creez vos types de seances (Yoga, Cross-training...) avant de les programmer dans le planning."
            action={
              <Link href="/cours/types-cours/nouveau">
                <Button>
                  <Plus className="size-4" />
                  Nouveau type
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {typesCours.map((t) => (
            <CarteTypeCours key={t.id} typeCours={t} />
          ))}
        </div>
      )}
    </div>
  );
}
