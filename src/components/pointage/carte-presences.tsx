// Bloc "Presences" de la fiche adherent : les derniers passages enregistres.
import { UserCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

type Passage = {
  id: string;
  horodatage: Date;
  statutAdherent: string;
};

/** "lundi 18 aout · 14:32", a l'heure de Dakar. */
function quand(date: Date) {
  const jour = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Dakar",
  }).format(date);

  const heure = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  }).format(date);

  return `${jour} · ${heure}`;
}

export function CartePresences({
  passages,
  total,
}: {
  passages: Passage[];
  total: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        titre="Presences"
        icone={<UserCheck className="size-4 text-brand" />}
        action={
          total > 0 ? (
            <span className="text-sm text-muted">
              {total} passage{total > 1 ? "s" : ""} au total
            </span>
          ) : undefined
        }
      />

      {passages.length === 0 ? (
        <EmptyState
          icone={<UserCheck className="size-5" />}
          titre="Aucun passage enregistre"
          description="Les passages apparaitront ici des que l'adherent aura pointe a l'entree."
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {passages.map((p) => {
              // Un passage sans abonnement valide reste visible : c'est
              // precisement ce que le gerant doit pouvoir retrouver.
              const alerte =
                p.statutAdherent === "EXPIRE" ||
                p.statutAdherent === "SUSPENDU";

              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5"
                >
                  <span className="text-sm text-ink first-letter:uppercase">
                    {quand(p.horodatage)}
                  </span>
                  {alerte && (
                    <span
                      className={cn(
                        "rounded-pill bg-danger-soft px-2 py-0.5",
                        "text-xs font-medium text-danger",
                      )}
                    >
                      Sans abonnement valide
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <CardBody className="pt-4">
            <p className="text-xs text-muted">
              Les 20 derniers passages. L&apos;heure affichee est celle du
              passage reel, meme si la borne etait hors ligne.
            </p>
          </CardBody>
        </>
      )}
    </Card>
  );
}
