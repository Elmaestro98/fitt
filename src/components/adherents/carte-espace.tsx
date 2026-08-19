"use client";

// Carte "Espace adherent" de la fiche, cote staff.
//
// Elle repond aux trois questions que le gerant se pose devant un adherent :
// lui a-t-on envoye un lien, s'en est-il servi, et comment lui couper l'acces
// si son telephone est perdu.
//
// /!\ Le lien genere n'est affiche QU'UNE FOIS (§9) : la base n'en garde
// qu'une empreinte SHA-256. L'ecran le dit, et propose la copie avant toute
// autre action.
import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  Loader2,
  MailCheck,
  Send,
  ShieldOff,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AlerteFormulaire } from "@/components/ui/form";
import {
  actionFermerAcces,
  actionInviterAdherent,
  actionRevoquerInvitation,
} from "@/lib/actions/espace-adherent";
import { formatDate, formatDateHeure } from "@/lib/utils/format";

export type EtatEspace = {
  invitation: {
    creeLe: Date;
    expireLe: Date;
    utiliseLe: Date | null;
    revoqueLe: Date | null;
  } | null;
  enAttente: boolean;
  actif: boolean;
  nombreSessions: number;
  dernierAcces: Date | null;
};

export function CarteEspace({
  adherentId,
  etat,
  invitable,
}: {
  adherentId: string;
  etat: EtatEspace;
  /** Faux pour une fiche en attente de validation ou archivee (§4). */
  invitable: boolean;
}) {
  const [lien, setLien] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function lancer(action: () => Promise<{ message?: string; lien?: string }>) {
    setMessage(null);
    demarrer(async () => {
      const resultat = await action();
      if (resultat.message) setMessage(resultat.message);
      if (resultat.lien) setLien(resultat.lien);
    });
  }

  return (
    <Card>
      <CardHeader
        titre="Espace adherent"
        icone={<Smartphone className="size-4 text-brand" />}
      />
      <CardBody className="space-y-4">
        {message && <AlerteFormulaire>{message}</AlerteFormulaire>}

        {lien ? (
          <LienGenere lien={lien} onFerme={() => setLien(null)} />
        ) : (
          <>
            <Statut etat={etat} invitable={invitable} />

            {invitable && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variante={etat.actif ? "contour" : "primaire"}
                  disabled={enCours}
                  onClick={() => lancer(() => actionInviterAdherent(adherentId))}
                >
                  {enCours ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {etat.invitation ? "Generer un nouveau lien" : "Inviter"}
                </Button>

                {etat.enAttente && (
                  <Button
                    type="button"
                    variante="contour"
                    disabled={enCours}
                    onClick={() =>
                      lancer(() => actionRevoquerInvitation(adherentId))
                    }
                  >
                    <X className="size-4" />
                    Annuler l&apos;invitation
                  </Button>
                )}

                {etat.actif && (
                  <Button
                    type="button"
                    variante="contour"
                    disabled={enCours}
                    onClick={() => lancer(() => actionFermerAcces(adherentId))}
                  >
                    <ShieldOff className="size-4" />
                    Fermer l&apos;acces
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

/* --- L'etat, en une phrase lisible par le gerant -------------------------- */

function Statut({
  etat,
  invitable,
}: {
  etat: EtatEspace;
  invitable: boolean;
}) {
  if (!invitable) {
    return (
      <Phrase
        ton="neutre"
        titre="Espace indisponible"
        detail="Validez d'abord cette fiche : un adherent en attente de validation n'a pas encore d'espace."
      />
    );
  }

  if (etat.actif) {
    return (
      <Phrase
        ton="succes"
        icone={<MailCheck className="size-4 text-success" />}
        titre="Espace ouvert"
        detail={
          etat.dernierAcces
            ? `Derniere visite le ${formatDateHeure(etat.dernierAcces)}${
                etat.nombreSessions > 1
                  ? ` — ${etat.nombreSessions} appareils connectes`
                  : ""
              }`
            : "Aucune visite enregistree pour l'instant."
        }
      />
    );
  }

  if (etat.enAttente && etat.invitation) {
    return (
      <Phrase
        ton="alerte"
        titre="Invitation envoyee, pas encore utilisee"
        detail={`Lien valable jusqu'au ${formatDate(etat.invitation.expireLe)}. Passe cette date, il faudra en generer un nouveau.`}
      />
    );
  }

  if (etat.invitation) {
    const raison = etat.invitation.revoqueLe
      ? "La derniere invitation a ete annulee."
      : etat.invitation.utiliseLe
        ? "L'invitation a ete utilisee, mais aucun acces n'est ouvert aujourd'hui."
        : `La derniere invitation a expire le ${formatDate(etat.invitation.expireLe)}.`;

    return (
      <Phrase ton="neutre" titre="Aucun acces ouvert" detail={raison} />
    );
  }

  return (
    <Phrase
      ton="neutre"
      titre="Jamais invite"
      detail="Generez un lien et transmettez-le par WhatsApp. L'adherent pourra consulter son abonnement et ses seances depuis son telephone."
    />
  );
}

const TONS = {
  neutre: "border-line bg-sunken",
  succes: "border-success/40 bg-success-soft",
  alerte: "border-warning/40 bg-warning-soft",
} as const;

function Phrase({
  ton,
  titre,
  detail,
  icone,
}: {
  ton: keyof typeof TONS;
  titre: string;
  detail: string;
  icone?: React.ReactNode;
}) {
  return (
    <div className={`rounded-control border px-4 py-3 ${TONS[ton]}`}>
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        {icone}
        {titre}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

/* --- Le lien, affiche une seule fois -------------------------------------- */

function LienGenere({
  lien,
  onFerme,
}: {
  lien: string;
  onFerme: () => void;
}) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      // Presse-papiers refuse (contexte non securise, permission) : le lien
      // reste selectionnable a la main dans le champ.
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-control border border-warning/40 bg-warning-soft px-4 py-3">
        <p className="text-sm font-medium text-ink">Copiez-le maintenant.</p>
        <p className="mt-1 text-xs text-muted">
          Ce lien ne sera plus jamais affiche : nous n&apos;en gardons
          qu&apos;une empreinte chiffree. Si vous le perdez, generez-en un
          nouveau — l&apos;ancien sera alors annule.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          readOnly
          value={lien}
          aria-label="Lien d'activation de l'espace adherent"
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-control border border-line bg-sunken px-3 font-mono text-xs text-ink focus:border-brand focus:outline-none"
        />
        <div className="flex gap-2">
          <Button type="button" onClick={copier} className="flex-1">
            {copie ? (
              <>
                <Check className="size-4" />
                Copie
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copier
              </>
            )}
          </Button>
          <Button type="button" variante="contour" onClick={onFerme}>
            Termine
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Valable 7 jours, utilisable une seule fois. Transmettez-le par WhatsApp
        a l&apos;adherent.
      </p>
    </div>
  );
}
