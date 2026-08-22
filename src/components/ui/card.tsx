import { cn } from "@/lib/utils/cn";

/* Le conteneur blanc de toutes tes maquettes : bordure fine plutot qu'ombre
   portee. C'est un choix net de ta charte — les cartes se detachent par le
   trait, pas par le relief. Ca ne bouge pas.

   Ce qui est ajoute, c'est le COMPORTEMENT :
   - `interactive` : la carte se souleve au survol. A n'activer que si elle
     est reellement cliquable ; une carte decorative qui bouge sous le
     curseur promet une action qui n'existe pas.
   - `anime` : la carte entre en fondu montant. Utile sur un contenu qui
     apparait apres coup (resultat de recherche, panneau qui se deplie) ;
     inutile — et donc a eviter — quand le parent porte deja `.cascade`. */
export function Card({
  interactive = false,
  anime = false,
  className,
  ...props
}: React.ComponentProps<"section"> & {
  interactive?: boolean;
  anime?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface",
        interactive && "carte-interactive",
        anime && "animate-apparition",
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
      <h2 className="display flex items-center gap-2 font-semibold text-ink">
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
