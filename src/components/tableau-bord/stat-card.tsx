import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/* Carte d'indicateur, reprise de public/maquette.png :
   label en majuscules, pastille d'icone teintee, grande valeur, variation.

   C'est la premiere chose que voit un gerant en ouvrant Fitt le matin. Deux
   details y sont donc traites avec soin :

   1. La valeur est en police display, chiffres a chasse fixe. Trois cartes
      cote a cote alignent leurs chiffres a la verticale au lieu de danser.
   2. La pastille d'icone se teinte franchement au survol de la carte, et
      l'icone grossit d'un cheveu. Le survol se propage depuis le conteneur
      (group), pas depuis la pastille : c'est la CARTE qui reagit, pas un
      petit carre isole. */
export function StatCard({
  label,
  valeur,
  icone,
  variation,
  referenceVariation = "periode precedente",
  precision,
  teinte = "brand",
  href,
}: {
  label: string;
  valeur: string;
  icone: React.ReactNode;
  /** Variation en % par rapport a la periode precedente. null = pas de
   *  reference (periode precedente vide : une division par zero n'aurait
   *  produit qu'un "+Infini %" ininterpretable). */
  variation?: number | null;
  /**
   * Ce a quoi la variation se compare, en toutes lettres.
   *
   * Parametrable et non fige a "mois dernier" : le tableau de bord se filtre
   * desormais par periode, et annoncer "vs mois dernier" sous un chiffre
   * calcule sur sept jours serait faux — d'autant plus dangereux que rien a
   * l'ecran ne permettrait de s'en apercevoir.
   */
  referenceVariation?: string;
  /** Texte secondaire, affiche quand il n'y a pas de variation. */
  precision?: string;
  teinte?: "brand" | "success" | "warning" | "info";
  /**
   * Ecran vers lequel la carte conduit. Facultatif — et c'est LUI qui decide
   * du comportement au survol.
   *
   * Sans href, la carte reste inerte : elle ne se souleve pas, sa pastille ne
   * se teinte pas. Une carte qui bouge sous le curseur promet une action ;
   * s'il n'y en a pas, l'utilisateur clique dans le vide et croit a un bug.
   * Le mouvement n'est jamais gratuit : il annonce toujours qu'il se passera
   * quelque chose.
   */
  href?: string;
}) {
  // Les variantes "group-hover" ne s'activent que si un ancetre porte la
  // classe "group" — ce que seule la version cliquable fait. Une meme table
  // de teintes sert donc les deux cas, sans condition.
  const teintes = {
    brand: "bg-brand-soft text-brand group-hover:bg-brand group-hover:text-white",
    success:
      "bg-success-soft text-success group-hover:bg-success group-hover:text-white",
    warning:
      "bg-warning-soft text-warning group-hover:bg-warning group-hover:text-white",
    info: "bg-info-soft text-info group-hover:bg-info group-hover:text-white",
  } as const;

  const hausse = typeof variation === "number" && variation >= 0;

  const contenu = (
    <>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {label}
          </p>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-control",
              "transition-[background-color,color,transform]",
              "duration-[var(--duree-courte)] ease-sortie group-hover:scale-110",
              teintes[teinte],
            )}
            aria-hidden="true"
          >
            {icone}
          </span>
        </div>

        <p className="display mt-3 text-3xl font-bold tracking-tight text-ink tabular-nums">
          {valeur}
        </p>

        {typeof variation === "number" ? (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-sm tabular-nums",
              hausse ? "text-success" : "text-danger",
            )}
          >
            {/* La fleche glisse dans son sens de lecture au survol : vers le
                haut si ca monte, vers le bas si ca descend. Le mouvement dit
                la meme chose que la couleur, pour qui ne distingue pas le
                vert du rouge. */}
            {hausse ? (
              <ArrowUpRight className="size-4 transition-transform duration-[var(--duree-courte)] ease-sortie group-hover:-translate-y-0.5" />
            ) : (
              <ArrowDownRight className="size-4 transition-transform duration-[var(--duree-courte)] ease-sortie group-hover:translate-y-0.5" />
            )}
            {hausse ? "+" : ""}
            {variation} % vs {referenceVariation}
          </p>
        ) : (
          precision && <p className="mt-1 text-sm text-muted">{precision}</p>
        )}
      </CardBody>

      {/* Fleche discrete, revelee au survol : elle confirme que la carte
          conduit quelque part, sans encombrer la carte au repos. */}
      {href && (
        <ArrowRight
          aria-hidden="true"
          className={
            "pointer-events-none absolute right-4 bottom-4 size-4 text-brand " +
            "translate-x-1 opacity-0 transition-[opacity,transform] " +
            "duration-[var(--duree-courte)] ease-sortie " +
            "group-hover:translate-x-0 group-hover:opacity-100"
          }
        />
      )}
    </>
  );

  if (!href) {
    return (
      <Card className="relative">
        {contenu}
      </Card>
    );
  }

  return (
    <Card interactive className="group relative">
      {/* Le lien couvre toute la carte plutot que d'entourer son contenu :
          la cible tactile fait alors la taille de la carte entiere (§11),
          et le balisage interne (titres, paragraphes) reste inchange. */}
      <Link
        href={href}
        className={
          "absolute inset-0 z-10 rounded-card outline-none " +
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        }
      >
        <span className="sr-only">{label} — voir le detail</span>
      </Link>
      {contenu}
    </Card>
  );
}
