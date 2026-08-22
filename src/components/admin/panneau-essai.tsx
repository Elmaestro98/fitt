// Les commandes commerciales d'une salle : accorder un essai, la marquer
// cliente payante, ou lui retirer toute limite.
//
// Server Component : ce ne sont que des formulaires POST, aucun etat local.
import { BadgeCheck, CalendarPlus, Infinity as InfiniteIcon } from "lucide-react";
import {
  actionAccorderEssai,
  actionDefinirAbonnement,
  actionRetirerEssai,
} from "@/lib/actions/admin";
import { joursRestantsEssai } from "@/lib/utils/acces-salle";
import { statutSalle } from "@/lib/utils/salle";
import { formatDateLongue } from "@/lib/utils/format";

type Salle = {
  id: string;
  actif: boolean;
  activeeLe: Date | null;
  essaiJusquau: Date | null;
  abonnee: boolean;
};

/** Les durees proposees. Volontairement peu nombreuses : un essai se decide
 *  en un clic, pas en remplissant un champ. */
const DUREES = [7, 14, 30];

export function PanneauEssai({ salle }: { salle: Salle }) {
  const statut = statutSalle(salle);
  const restants = joursRestantsEssai(salle);

  const resume = salle.abonnee
    ? "Cliente payante — aucune limite de duree."
    : !salle.essaiJusquau
      ? "Aucune limite fixee. Cette salle utilise Fitt sans echeance."
      : statut === "essai_expire"
        ? `Essai termine le ${formatDateLongue(salle.essaiJusquau)}. L'acces est coupe.`
        : `Essai jusqu'au ${formatDateLongue(salle.essaiJusquau)} — ${restants} jour${restants && restants > 1 ? "s" : ""} restant${restants && restants > 1 ? "s" : ""}.`;

  return (
    <div className="rounded-card border border-admin-line bg-admin-surface p-4 text-admin-text">
      <p className="text-sm font-medium">Essai et abonnement</p>
      <p className="mt-0.5 text-xs text-admin-muted">{resume}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-admin-line pt-4">
        {DUREES.map((jours) => (
          <form key={jours} action={actionAccorderEssai}>
            <input type="hidden" name="id" value={salle.id} />
            <input type="hidden" name="jours" value={jours} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-admin-line px-3 text-sm text-admin-text hover:bg-admin-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
            >
              <CalendarPlus className="size-4" />
              {/* "Prolonger" quand un essai court deja : "+7 jours" sur une
                  salle qui en a encore 10 pourrait laisser croire qu'on la
                  ramene a 7. */}
              {salle.essaiJusquau && !salle.abonnee ? "+" : ""}
              {jours} jours
            </button>
          </form>
        ))}

        <form action={actionDefinirAbonnement}>
          <input type="hidden" name="id" value={salle.id} />
          <input type="hidden" name="abonnee" value={salle.abonnee ? "false" : "true"} />
          <button
            type="submit"
            className={
              "inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent " +
              (salle.abonnee
                ? "border border-admin-line text-admin-muted hover:bg-admin-surface-hover"
                : "bg-admin-success/15 text-admin-success hover:bg-admin-success/25")
            }
          >
            <BadgeCheck className="size-4" />
            {salle.abonnee ? "Retirer l'abonnement" : "Marquer abonnee"}
          </button>
        </form>

        {salle.essaiJusquau && !salle.abonnee && (
          <form action={actionRetirerEssai}>
            <input type="hidden" name="id" value={salle.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm text-admin-muted hover:bg-admin-surface-hover hover:text-admin-text focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
            >
              <InfiniteIcon className="size-4" />
              Supprimer l&apos;essai
            </button>
          </form>
        )}
      </div>

      <p className="mt-3 text-xs text-admin-muted">
        Prolonger ajoute les jours a la fin de l&apos;essai en cours, jamais a
        aujourd&apos;hui : une salle a qui il reste 10 jours en aura bien 24
        apres un « +14 jours ».
      </p>
    </div>
  );
}
