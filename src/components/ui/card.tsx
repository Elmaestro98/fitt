import { cn } from "@/lib/utils/cn";

/* Le conteneur blanc de toutes tes maquettes : bordure fine plutot qu'ombre
   portee. C'est un choix net de ta charte — les cartes se detachent par le
   trait, pas par le relief. */
export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface",
        className,
      )}
      {...props}
    />
  );
}

/* En-tete de carte : titre a gauche, action facultative a droite
   ("Voir tout" dans "Abonnements expirant bientot", "Mensuel" dans le graphe). */
export function CardHeader({
  titre,
  icone,
  action,
  className,
}: {
  titre: string;
  icone?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-4",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 font-semibold text-ink">
        {icone}
        {titre}
      </h2>
      {action}
    </header>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
