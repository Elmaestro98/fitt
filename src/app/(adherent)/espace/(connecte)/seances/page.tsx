// Historique des seances de l'adherent.
//
// Volontairement depouille : des dates, groupees par mois. Pas de graphique
// d'assiduite, pas de moyenne, pas de commentaire — Fitt enregistre des
// mesures, il ne conseille pas (§9). Encourager ou reprocher releve du coach,
// pas du logiciel.
import { CalendarCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { seancesEspace } from "@/lib/data/espace";
import { formatDateHeure } from "@/lib/utils/format";

export const metadata = { title: "Mes seances — Fitt" };

const MOIS = [
  "janvier",
  "fevrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
] as const;

export default async function PageSeances() {
  const { seances, total } = await seancesEspace();

  // Regroupement par mois, dans l'ordre d'arrivee : la liste est deja triee
  // du plus recent au plus ancien.
  const groupes = new Map<string, typeof seances>();
  for (const seance of seances) {
    const d = seance.horodatage;
    const cle = `${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const existant = groupes.get(cle);
    if (existant) existant.push(seance);
    else groupes.set(cle, [seance]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Mes seances"
        sousTitre={
          total > 1
            ? `${total} venues enregistrees`
            : `${total} venue enregistree`
        }
      />

      {seances.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<CalendarCheck className="size-6" />}
              titre="Aucune seance"
              description="Vos venues apparaitront ici des votre premier passage a la salle."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {[...groupes.entries()].map(([mois, lignes]) => (
            <section key={mois}>
              <h2 className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
                {mois} — {lignes.length}
              </h2>
              <Card>
                <CardBody className="divide-y divide-line p-0">
                  {lignes.map((seance) => (
                    <p
                      key={seance.id}
                      className="px-4 py-3 text-sm text-ink"
                    >
                      {formatDateHeure(seance.horodatage)}
                    </p>
                  ))}
                </CardBody>
              </Card>
            </section>
          ))}
        </div>
      )}

      {total > seances.length && (
        <p className="text-xs text-muted">
          Seules les {seances.length} dernieres seances sont affichees.
        </p>
      )}
    </div>
  );
}
