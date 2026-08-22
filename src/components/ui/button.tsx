import { cn } from "@/lib/utils/cn";

/* Les variantes relevees dans les maquettes :
   - primaire   : "+ Nouveau Membre" (tableau de bord), orange plein
   - contour    : "Relancer", "Modifier", "Nouveau Paiement"
   - fantome    : actions discretes sans bordure
   - whatsapp   : "Envoyer un rappel WhatsApp" (fiche adherent), vert de marque
   - danger     : "Suspendre" (fiche adherent), rouge

   Le survol ne change pas QUE la couleur : le bouton principal prend une
   lueur orange diffuse, comme s'il eclairait la surface sous lui. C'est ce
   qui distingue un bouton dessine d'un bouton vivant. */
const variantes = {
  primaire:
    "bg-brand text-white border border-transparent hover:bg-brand-hover hover:shadow-lueur",
  contour:
    "bg-surface text-ink border border-line hover:bg-sunken hover:border-brand/40",
  fantome:
    "bg-transparent text-muted border border-transparent hover:bg-sunken hover:text-ink",
  whatsapp:
    "bg-whatsapp text-white border border-transparent hover:brightness-95 hover:shadow-souleve",
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
  /**
   * Action en cours cote serveur. Affiche un anneau qui tourne A LA PLACE
   * de l'icone et bloque le bouton.
   *
   * Pourquoi ca compte ici plus qu'ailleurs : a l'accueil d'une salle, sur
   * une connexion lente, rien ne prouve au gerant que son appui est parti.
   * Sans ce retour, il appuie une deuxieme fois — et cree un deuxieme
   * paiement. Le bouton bloque est donc aussi une protection des donnees,
   * pas seulement une politesse visuelle.
   */
  chargement?: boolean;
};

export function Button({
  variante = "primaire",
  taille = "md",
  chargement = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      // aria-busy : un lecteur d'ecran annonce l'attente au lieu de laisser
      // croire que rien ne s'est passe.
      aria-busy={chargement || undefined}
      disabled={disabled || chargement}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-control",
        // Libelle en police display : texte court, lu d'un coup d'oeil.
        "font-display font-medium tracking-tight",
        // La transition porte sur TOUT ce qui bouge, pas seulement la
        // couleur : sans elle, l'ombre du survol apparaitrait d'un bloc.
        "transition-[color,background-color,border-color,box-shadow,transform]",
        "duration-[var(--duree-instant)] ease-sortie outline-none",
        // Enfoncement a l'appui (classe .enfoncable de globals.css) : le seul
        // retour tactile possible au doigt.
        "enfoncable",
        // Anneau de focus visible : obligatoire pour la navigation au clavier.
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        // Un bouton desactive doit se voir ET ne plus reagir au survol.
        "disabled:pointer-events-none disabled:opacity-50",
        variantes[variante],
        tailles[taille],
        className,
      )}
      {...props}
    >
      {/* L'anneau se place LA OU serait l'icone, et le libelle reste lisible.
          Deux raisons de ne pas masquer le texte :
          - "Encaisser 15 000 FCFA" pendant l'attente rassure sur ce qui est
            en train de partir ;
          - un bouton dont le contenu disparait a l'air casse.
          La regle qui va avec : l'appelant ne change PAS le libelle en
          "Enregistrement...". C'est l'anneau qui dit l'attente, pas le texte
          — sinon la largeur du bouton saute au moment du clic. */}
      {chargement && <Anneau />}
      {children}
    </button>
  );
}

/* Anneau de chargement en CSS pur : une bordure dont un seul cote est
   colore, mise en rotation. Aucun SVG, aucun JavaScript. */
function Anneau() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 animate-spin rounded-full",
        "border-2 border-current border-t-transparent opacity-70",
      )}
    />
  );
}
