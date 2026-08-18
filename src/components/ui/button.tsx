import { cn } from "@/lib/utils/cn";

/* Les 4 variantes relevees dans les maquettes :
   - primaire   : "+ Nouveau Membre" (tableau de bord), orange plein
   - contour    : "Relancer", "Modifier", "Nouveau Paiement"
   - fantome    : actions discretes sans bordure
   - whatsapp   : "Envoyer un rappel WhatsApp" (fiche adherent), vert de marque
   - danger     : "Suspendre" (fiche adherent), rouge */
const variantes = {
  primaire:
    "bg-brand text-white hover:bg-brand-hover border border-transparent",
  contour:
    "bg-surface text-ink border border-line hover:bg-sunken",
  fantome:
    "bg-transparent text-muted border border-transparent hover:bg-sunken hover:text-ink",
  whatsapp:
    "bg-whatsapp text-white hover:brightness-95 border border-transparent",
  danger:
    "bg-transparent text-danger border border-transparent hover:bg-danger-soft",
} as const;

/* min-h-11 = 44 px : cible tactile minimale (CLAUDE.md §11). */
const tailles = {
  sm: "h-9 min-h-9 px-3 text-sm gap-1.5",
  md: "h-11 min-h-11 px-4 text-sm gap-2",
  lg: "h-12 min-h-12 px-6 text-base gap-2",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variante?: keyof typeof variantes;
  taille?: keyof typeof tailles;
};

export function Button({
  variante = "primaire",
  taille = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-control font-medium",
        "transition-colors outline-none",
        // Anneau de focus visible : obligatoire pour la navigation au clavier.
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        // Un bouton desactive doit se voir ET ne plus reagir au survol.
        "disabled:pointer-events-none disabled:opacity-50",
        variantes[variante],
        tailles[taille],
        className,
      )}
      {...props}
    />
  );
}
