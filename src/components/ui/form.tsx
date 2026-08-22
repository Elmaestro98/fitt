import { cn } from "@/lib/utils/cn";

/* Champs de formulaire du design system. Aucun n'est un composant client :
   ce sont des balises HTML habillees. L'interactivite vient du formulaire
   qui les contient. */

export function Champ({
  label,
  htmlFor,
  erreurs,
  aide,
  requis,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  erreurs?: string[];
  aide?: string;
  requis?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const idErreur = `${htmlFor}-erreur`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {requis && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {aide && !erreurs?.length && (
        <p className="text-xs text-muted">{aide}</p>
      )}

      {/* aria-live : un lecteur d'ecran annonce l'erreur des son apparition,
          sans que l'utilisateur ait a revenir sur le champ.
          L'entree en fondu montant attire l'oeil vers le message : une erreur
          qui apparait sans mouvement passe inapercue sous le champ. */}
      {erreurs?.length ? (
        <p
          id={idErreur}
          className="animate-apparition text-xs text-danger"
          aria-live="polite"
        >
          {erreurs[0]}
        </p>
      ) : null}
    </div>
  );
}

/* Le champ au repos est PLAT (fond enfonce, bordure discrete) et se
   "reveille" au focus : fond blanc, bordure orange, et un anneau tres pale
   autour. Cet anneau n'est pas decoratif — sur un telephone tenu a bout de
   bras dans une salle eclairee au neon, une simple bordure de 1 px ne se
   voit pas, et l'on ne sait plus dans quel champ on tape. */
const baseChamp =
  "w-full rounded-control border bg-surface px-3 text-sm text-ink " +
  "placeholder:text-muted outline-none " +
  "transition-[border-color,box-shadow,background-color] " +
  "duration-[var(--duree-instant)] ease-sortie " +
  "focus:border-brand focus:ring-4 focus:ring-brand/12 " +
  "disabled:cursor-not-allowed disabled:bg-sunken";

export function Input({
  invalide,
  className,
  ...props
}: React.ComponentProps<"input"> & { invalide?: boolean }) {
  return (
    <input
      aria-invalid={invalide || undefined}
      className={cn(
        baseChamp,
        "h-11",
        invalide ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  invalide,
  className,
  ...props
}: React.ComponentProps<"select"> & { invalide?: boolean }) {
  return (
    <select
      aria-invalid={invalide || undefined}
      className={cn(
        baseChamp,
        "h-11",
        invalide ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  invalide,
  className,
  ...props
}: React.ComponentProps<"textarea"> & { invalide?: boolean }) {
  return (
    <textarea
      aria-invalid={invalide || undefined}
      className={cn(
        baseChamp,
        "min-h-24 py-2.5",
        invalide ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

/* Bandeau d'erreur globale : echec qui ne concerne aucun champ en particulier
   (doublon detecte par la base, perte de connexion...). */
export function AlerteFormulaire({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={
        "animate-apparition rounded-control border border-danger/30 " +
        "bg-danger-soft px-4 py-3 text-sm text-danger"
      }
    >
      {children}
    </div>
  );
}
