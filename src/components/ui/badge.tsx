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

type BadgeProps = React.ComponentProps<"span"> & {
  ton?: keyof typeof tons;
};

export function Badge({ ton = "neutre", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1",
        "text-xs font-medium whitespace-nowrap",
        tons[ton],
        className,
      )}
      {...props}
    />
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
  return <Badge ton={ton}>{libelle}</Badge>;
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
  return <Badge ton={ton}>{libelle}</Badge>;
}
