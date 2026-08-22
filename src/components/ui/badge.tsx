import { cn } from "@/lib/utils/cn";

/* Fond teinte + texte de la meme famille, comme les badges "Paye" (vert),
   "Annuel" (gris) et "Mensuel" (bleu) des maquettes.
   `neutre` et `info` couvrent les formules d'abonnement ; les autres portent
   les statuts metier. */
const tons = {
  succes: "bg-success-soft text-success",
  alerte: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutre: "bg-sunken text-muted",
  info: "bg-info-soft text-info",
} as const;

/* Couleur de la pastille, par ton. Elle reprend la couleur du texte : une
   pastille grise sur un badge vert ferait deux informations au lieu d'une. */
const pastilles = {
  succes: "bg-success",
  alerte: "bg-warning",
  danger: "bg-danger",
  neutre: "bg-muted",
  info: "bg-info",
} as const;

type BadgeProps = React.ComponentProps<"span"> & {
  ton?: keyof typeof tons;
  /**
   * Pastille ronde devant le libelle.
   *
   * Ce n'est pas decoratif : environ un homme sur douze distingue mal le
   * rouge du vert. "Actif" et "Expire" ne doivent donc jamais se differencier
   * par la SEULE couleur — le mot le dit, et la pastille donne un second
   * repere de forme. Sur un badge deja accompagne d'une icone, laisser a
   * false pour ne pas empiler les signaux.
   */
  pastille?: boolean;
};

export function Badge({
  ton = "neutre",
  pastille = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        // Meme transition que les boutons : un badge qui change de statut
        // (Actif -> Expire) fond d'une couleur a l'autre au lieu de sauter.
        "transition-colors duration-[var(--duree-courte)] ease-sortie",
        tons[ton],
        className,
      )}
      {...props}
    >
      {pastille && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", pastilles[ton])}
        />
      )}
      {children}
    </span>
  );
}

/* Traduction des statuts stockes en MAJUSCULES (CLAUDE.md §8) vers
   le libelle francais + le ton visuel. La base ne stocke jamais de francais ;
   la traduction se fait ici, a l'affichage, et a un seul endroit. */
const STATUTS = {
  ACTIF: { libelle: "Actif", ton: "succes" },
  EXPIRE: { libelle: "Expire", ton: "danger" },
  SUSPENDU: { libelle: "Suspendu", ton: "alerte" },
  EN_ATTENTE_VALIDATION: { libelle: "En attente", ton: "neutre" },
  ARCHIVE: { libelle: "Archive", ton: "neutre" },
} as const;

export type StatutAdherent = keyof typeof STATUTS;

export function BadgeStatut({ statut }: { statut: StatutAdherent }) {
  const { libelle, ton } = STATUTS[statut];
  return (
    <Badge ton={ton} pastille>
      {libelle}
    </Badge>
  );
}

/* Statuts de commande de la boutique. Meme principe : la base ne stocke que
   des MAJUSCULES non traduites, le francais vit ici. */
const STATUTS_COMMANDE = {
  EN_ATTENTE: { libelle: "En preparation", ton: "alerte" },
  PRETE: { libelle: "Prete", ton: "info" },
  RECUPEREE: { libelle: "Recuperee", ton: "succes" },
  ANNULEE: { libelle: "Annulee", ton: "neutre" },
} as const;

export type StatutCommande = keyof typeof STATUTS_COMMANDE;

export function BadgeStatutCommande({ statut }: { statut: StatutCommande }) {
  const { libelle, ton } = STATUTS_COMMANDE[statut];
  return (
    <Badge ton={ton} pastille>
      {libelle}
    </Badge>
  );
}
