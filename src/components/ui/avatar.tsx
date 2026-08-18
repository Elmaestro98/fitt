import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/* Les maquettes montrent les deux cas : photo (Moussa Diop, Awa Ndiaye) et
   initiales sur fond teinte (OM, SF, FB). Une salle qui saisit 300 adherents
   au carnet ne mettra pas 300 photos : les initiales sont le cas NORMAL,
   pas le cas d'erreur. */

const tailles = {
  sm: { classe: "size-8 text-xs", px: 32 },
  md: { classe: "size-10 text-sm", px: 40 },
  lg: { classe: "size-14 text-base", px: 56 },
  xl: { classe: "size-24 text-2xl", px: 96 },
} as const;

/* Teintes douces pour le fond des initiales. On en choisit une de facon
   deterministe a partir du nom : le meme adherent garde toujours la meme
   couleur, d'un ecran a l'autre et d'une session a l'autre. */
const TEINTES = [
  "bg-brand-soft text-brand",
  "bg-success-soft text-success",
  "bg-[#DAE2FD] text-[#2B4BA8]",
  "bg-warning-soft text-warning",
  "bg-sunken text-muted",
] as const;

function initiales(nom: string) {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0] ?? "")
    .join("")
    .toUpperCase();
}

function teintePour(nom: string) {
  let somme = 0;
  for (const c of nom) somme += c.charCodeAt(0);
  return TEINTES[somme % TEINTES.length];
}

type AvatarProps = {
  nom: string;
  photoUrl?: string | null;
  taille?: keyof typeof tailles;
  /** Pastille de statut en bas a droite, comme sur la fiche adherent. */
  statut?: "actif" | "expire" | "suspendu";
  className?: string;
};

const PASTILLES = {
  actif: "bg-success",
  expire: "bg-danger",
  suspendu: "bg-warning",
} as const;

export function Avatar({
  nom,
  photoUrl,
  taille = "md",
  statut,
  className,
}: AvatarProps) {
  const { classe, px } = tailles[taille];

  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={nom}
          width={px}
          height={px}
          className={cn(classe, "rounded-full object-cover")}
        />
      ) : (
        <span
          className={cn(
            classe,
            "flex items-center justify-center rounded-full font-semibold",
            teintePour(nom),
          )}
          // Le nom est deja affiche a cote dans toutes les maquettes :
          // l'avatar est decoratif, on l'ignore pour les lecteurs d'ecran.
          aria-hidden="true"
        >
          {initiales(nom)}
        </span>
      )}

      {statut && (
        <span
          className={cn(
            "absolute right-0 bottom-0 block rounded-full",
            "size-3 border-2 border-surface",
            PASTILLES[statut],
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
