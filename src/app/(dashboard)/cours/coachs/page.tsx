import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CarteCoach } from "@/components/coachs/carte-coach";
import { listerCoachs } from "@/lib/data/coach";

export const metadata = { title: "Coachs — Fitt" };

export default async function PageCoachs() {
  // On affiche aussi les archives : le gerant doit pouvoir les retrouver et
  // les reactiver, et comprendre pourquoi une ancienne seance les cite.
  const coachs = await listerCoachs({ inclureArchives: true });
  const actifs = coachs.filter((c) => c.actif).length;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Coachs"
        sousTitre={
          coachs.length === 0
            ? "Les personnes qui animent vos cours"
            : `${actifs} coach${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""} sur ${coachs.length}`
        }
        action={
          <Link href="/cours/coachs/nouveau">
            <Button>
              <Plus className="size-4" />
              Nouveau coach
            </Button>
          </Link>
        }
      />

      {coachs.length === 0 ? (
        <Card>
          <EmptyState
            icone={<Dumbbell className="size-5" />}
            titre="Aucun coach"
            description="Ajoutez vos coachs pour pouvoir leur assigner des seances de cours."
            action={
              <Link href="/cours/coachs/nouveau">
                <Button>
                  <Plus className="size-4" />
                  Nouveau coach
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coachs.map((c) => (
            <CarteCoach key={c.id} coach={c} />
          ))}
        </div>
      )}
    </div>
  );
}
