import Link from "next/link";
import { CalendarDays, Dumbbell, Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { LigneSession } from "@/components/cours/ligne-session";
import { listerSessionsCours } from "@/lib/data/session-cours";
import { formatDateLongue } from "@/lib/utils/format";

export const metadata = { title: "Planning des cours — Fitt" };

export default async function PageCours() {
  const sessions = await listerSessionsCours();

  // Regroupement par jour, dans l'ordre chronologique deja fourni par la
  // requete (§7 : pagination et recherche cote serveur, ici un simple tri).
  const groupes = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const cle = formatDateLongue(session.debutLe);
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(session);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Cours & coachs"
        sousTitre={
          sessions.length === 0
            ? "Le planning des seances de votre salle"
            : `${sessions.length} seance${sessions.length > 1 ? "s" : ""} au planning`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/cours/coachs">
              <Button variante="contour" taille="sm">
                <Dumbbell className="size-4" />
                Coachs
              </Button>
            </Link>
            <Link href="/cours/types-cours">
              <Button variante="contour" taille="sm">
                <Palette className="size-4" />
                Types de cours
              </Button>
            </Link>
            <Link href="/cours/nouvelle">
              <Button taille="sm">
                <Plus className="size-4" />
                Nouvelle seance
              </Button>
            </Link>
          </div>
        }
      />

      {sessions.length === 0 ? (
        <Card>
          <EmptyState
            icone={<CalendarDays className="size-5" />}
            titre="Aucune seance programmee"
            description="Programmez votre premiere seance : choisissez un type de cours, un coach, une date et une heure."
            action={
              <Link href="/cours/nouvelle">
                <Button>
                  <Plus className="size-4" />
                  Nouvelle seance
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {[...groupes.entries()].map(([jour, sessionsDuJour]) => (
            <div key={jour}>
              <h2 className="mb-2 text-sm font-semibold text-muted capitalize">
                {jour}
              </h2>
              <div className="space-y-2">
                {sessionsDuJour.map((s) => (
                  <LigneSession key={s.id} session={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
