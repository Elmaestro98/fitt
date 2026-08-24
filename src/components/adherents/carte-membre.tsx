// La carte membre physique d'un adherent : ce qui s'imprime, pas ce qui
// s'affiche dans le back-office. Format ID-1 (carte de credit/carte
// d'identite, 85,6 x 54 mm) via aspect-[85.6/53.98], pour que l'impression
// (voir page.tsx du dossier carte/) tombe a la bonne taille sur du papier
// carte pre-decoupe.
//
// Toutes les donnees viennent de la fiche adherent et des parametres de la
// salle deja charges par la page : ce composant n'appelle rien lui-meme, il
// se contente de les mettre en forme (§7 : Server Component par defaut).
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { formaterTelephone } from "@/lib/utils/telephone";

type CarteMembreProps = {
  adherent: {
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
  gym: {
    nom: string;
    telephone: string | null;
    adresse: string | null;
    ville: string | null;
    /** null = pas de logo televerse, on retombe sur le logo Fitt par
     *  defaut (§7, parametres de la salle). */
    logoUrl: string | null;
  };
};

export function CarteMembre({ adherent, gym }: CarteMembreProps) {
  const nomComplet = `${adherent.prenom} ${adherent.nom}`;
  const adresseComplete = [gym.adresse, gym.ville].filter(Boolean).join(", ");

  return (
    <div className="carte-membre relative mx-auto flex aspect-[85.6/53.98] w-full max-w-[400px] flex-col justify-between overflow-hidden rounded-2xl bg-[#2D3133] p-5 text-white shadow-lg">
      {/* Accents decoratifs, purement visuels : aria-hidden, et pas de
          mouvement (une carte au repos reste plate, CLAUDE.md §11). */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-[var(--color-brand)]/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-10 size-40 rounded-full bg-[var(--color-brand)]/10"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        {/* Boite de taille fixe + object-contain : le logo d'une salle peut
            avoir n'importe quel ratio, contrairement au logo Fitt (§7) — sans
            ca, un logo carre serait ecrase dans un cadre 3:1. */}
        <div className="relative h-7 w-24">
          <Image
            src={gym.logoUrl ?? "/logo-fitt.png"}
            alt={gym.logoUrl ? gym.nom : "Fitt"}
            fill
            sizes="96px"
            className="object-contain object-left"
          />
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
          MEMBRE
        </span>
      </div>

      <div className="relative z-10 flex items-end gap-3">
        <Avatar
          nom={nomComplet}
          photoUrl={adherent.photoUrl}
          taille="lg"
          className="ring-2 ring-white/20"
        />
        <div className="min-w-0">
          <p className="display truncate text-lg leading-tight font-bold">
            {nomComplet}
          </p>
          <p className="font-mono text-sm text-[var(--color-brand)]">
            {adherent.numero}
          </p>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-2.5 text-white/70">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-medium text-white">{gym.nom}</span>
          {gym.telephone && (
            <span className="shrink-0">{formaterTelephone(gym.telephone)}</span>
          )}
        </div>
        {adresseComplete && (
          <p className="mt-0.5 truncate text-[10px]">{adresseComplete}</p>
        )}
      </div>
    </div>
  );
}
