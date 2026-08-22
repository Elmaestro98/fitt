"use client";

// Les commandes d'essai d'une salle, dans le tableau de /admin.
//
// Un menu plutot que six boutons par ligne : le tableau porte deja six
// colonnes, et ces actions sont occasionnelles. Le meme jeu d'actions existe
// deploye sur la fiche de la salle (panneau-essai.tsx), ou la place ne manque
// pas — ici on optimise le geste rapide, la-bas la lecture.
import { useTransition } from "react";
import { BadgeCheck, CalendarPlus, ChevronDown, Infinity as InfiniteIcon, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useAdminPortalContainer } from "@/components/admin/admin-theme-context";
import {
  actionAccorderEssai,
  actionDefinirAbonnement,
  actionRetirerEssai,
} from "@/lib/actions/admin";
import { detailEssai } from "@/lib/utils/salle";

type Salle = {
  id: string;
  nom: string;
  actif: boolean;
  activeeLe: Date | null;
  essaiJusquau: Date | null;
  abonnee: boolean;
};

const DUREES = [7, 14, 30];

export function MenuEssai({ salle }: { salle: Salle }) {
  const conteneur = useAdminPortalContainer();
  const detail = detailEssai(salle);
  const [enCours, demarrer] = useTransition();

  /**
   * /!\ On appelle la Server Action a la main plutot que d'envelopper chaque
   * entree dans un <form>. Radix ferme le menu des la selection, ce qui
   * DEMONTE le contenu du portail — donc le formulaire — avant que le
   * navigateur ait eu le temps de le soumettre. Le clic n'avait alors aucun
   * effet, silencieusement.
   */
  function lancer(
    action: (formData: FormData) => Promise<void>,
    champs: Record<string, string | number>,
  ) {
    const donnees = new FormData();
    for (const [nom, valeur] of Object.entries(champs)) {
      donnees.append(nom, String(valeur));
    }
    demarrer(async () => {
      await action(donnees);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1 rounded-control border border-admin-line px-2.5 text-xs text-admin-muted hover:bg-admin-surface-hover hover:text-admin-text focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
          aria-label={`Essai de ${salle.nom}`}
        >
          Essai
          {enCours ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        container={conteneur}
        align="end"
        className="w-56 border-admin-line bg-admin-surface text-admin-text"
      >
        <DropdownMenuLabel className="text-admin-muted">
          {salle.abonnee
            ? "Cliente payante"
            : (detail ?? "Aucune limite fixee")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-admin-line" />

        {DUREES.map((jours) => (
          <DropdownMenuItem
            key={jours}
            onSelect={() => lancer(actionAccorderEssai, { id: salle.id, jours })}
          >
            <CalendarPlus className="size-4" />
            {salle.essaiJusquau && !salle.abonnee
              ? `Prolonger de ${jours} jours`
              : `Accorder ${jours} jours`}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-admin-line" />

        {/* Visible seulement quand il y a effectivement un essai a retirer :
            proposer "Supprimer l'essai" a une salle qui n'en a pas serait une
            entree sans effet. */}
        {salle.essaiJusquau && (
          <DropdownMenuItem
            onSelect={() => lancer(actionRetirerEssai, { id: salle.id })}
          >
            <InfiniteIcon className="size-4" />
            Supprimer l&apos;essai
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onSelect={() =>
            lancer(actionDefinirAbonnement, {
              id: salle.id,
              abonnee: salle.abonnee ? "false" : "true",
            })
          }
        >
          <BadgeCheck className="size-4" />
          {salle.abonnee ? "Retirer l'abonnement" : "Marquer abonnee"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
