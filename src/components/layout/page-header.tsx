import { cn } from "@/lib/utils/cn";

/* Titre + sous-titre a gauche, action principale a droite.
   Repris tel quel de la maquette : "Vue d'ensemble" / "Aujourd'hui, 24 Mai
   2024" / bouton "+ Nouveau Membre". */
export function PageHeader({
  titre,
  sousTitre,
  action,
  className,
}: {
  titre: string;
  sousTitre?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {/* Le titre de page est le seul texte de l'ecran en display GRAS :
            c'est le point d'ancrage du regard a l'arrivee. */}
        <h1 className="display truncate text-2xl font-bold tracking-tight text-ink">
          {titre}
        </h1>
        {sousTitre && <p className="mt-1 text-sm text-muted">{sousTitre}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
