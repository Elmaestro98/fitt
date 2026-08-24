// Le verso de la carte membre : coordonnees, plus une grille de douze cases
// que le gerant coche a la main (un stylo, pas un clic) a chaque mois payes
// — le suivi papier classique d'un abonnement mensuel, complementaire du
// journal de caisse numerique (Paiement) qui reste la source de verite pour
// les rapports. Meme format que le recto (carte-membre.tsx).
import { formaterTelephone } from "@/lib/utils/telephone";
import { formatDate } from "@/lib/utils/format";

const MOIS = [
  "Jan",
  "Fev",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aou",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type CarteMembreVersoProps = {
  adherent: {
    telephone: string;
    creeLe: Date;
  };
  /** null si aucun abonnement en cours (adherent inscrit mais pas encore
   *  abonne, ou abonnement echu) : on l'affiche plutot que de le cacher, un
   *  gerant qui verifie une carte doit voir cette situation d'un coup d'oeil. */
  abonnement: { finLe: Date } | null;
  gym: {
    nom: string;
    adresse: string | null;
    ville: string | null;
  };
};

export function CarteMembreVerso({
  adherent,
  abonnement,
  gym,
}: CarteMembreVersoProps) {
  const adresseComplete = [gym.adresse, gym.ville].filter(Boolean).join(", ");

  return (
    <div className="carte-membre relative mx-auto flex aspect-[85.6/53.98] w-full max-w-[400px] flex-col justify-between gap-2 overflow-hidden rounded-2xl bg-[#2D3133] p-5 text-white shadow-lg">
      <div
        className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-[var(--color-brand)]/10"
        aria-hidden="true"
      />

      <dl className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <Champ label="Telephone">{formaterTelephone(adherent.telephone)}</Champ>
        <Champ label="Adherent depuis">{formatDate(adherent.creeLe)}</Champ>
        <Champ label="Valide jusqu'au">
          {abonnement ? (
            formatDate(abonnement.finLe)
          ) : (
            <span className="text-white/50">Aucun abonnement en cours</span>
          )}
        </Champ>
      </dl>

      {/* Case a cocher par le personnel a chaque mois paye — pas une donnee
          en base, un repere visuel que le gerant remplit lui-meme. */}
      <div className="relative z-10">
        <p className="text-[9px] tracking-wide text-white/50 uppercase">
          Mois payes
        </p>
        <div className="mt-1 grid grid-cols-6 gap-x-1 gap-y-1.5">
          {MOIS.map((mois) => (
            <div key={mois} className="flex flex-col items-center gap-0.5">
              <span
                className="size-3.5 rounded-[3px] border border-white/40"
                aria-hidden="true"
              />
              <span className="text-[7px] leading-none text-white/60">
                {mois}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 pt-2 text-[11px] text-white/70">
        <p className="font-semibold text-white">{gym.nom}</p>
        {adresseComplete && <p className="mt-0.5 truncate">{adresseComplete}</p>}
      </div>
    </div>
  );
}

function Champ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-white/50">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-white">{children}</dd>
    </div>
  );
}
