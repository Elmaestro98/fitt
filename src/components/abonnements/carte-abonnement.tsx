import Link from "next/link";
import { CalendarClock, Plus, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BoutonAnnuler } from "@/components/abonnements/bouton-annuler";
import { formatFCFA, formatDateLongue } from "@/lib/utils/format";
import { joursRestants } from "@/lib/utils/duree";
import {
  lienWhatsApp,
  messageRelanceAbonnement,
  SEUIL_RELANCE_JOURS,
} from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils/cn";

type Abonnement = {
  id: string;
  nomFormule: string;
  prixPaye: number;
  debutLe: Date;
  finLe: Date;
};

export function CarteAbonnement({
  adherentId,
  prenomAdherent,
  telephoneAdherent,
  nomSalle,
  abonnement,
}: {
  adherentId: string;
  prenomAdherent: string;
  telephoneAdherent: string;
  nomSalle: string;
  abonnement: Abonnement | null;
}) {
  if (!abonnement) {
    return (
      <Card>
        <CardHeader
          titre="Abonnement"
          icone={<CalendarClock className="size-4 text-muted" />}
        />
        <CardBody>
          <p className="text-sm text-muted">
            Aucun abonnement en cours. L&apos;adherent n&apos;a pas acces a la
            salle tant qu&apos;il n&apos;a pas souscrit.
          </p>
          <Link
            href={`/adherents/${adherentId}/abonnement`}
            className="mt-4 inline-block"
          >
            <Button>
              <Plus className="size-4" />
              Souscrire un abonnement
            </Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  const restants = joursRestants(abonnement.finLe);
  const total = Math.max(
    1,
    Math.round(
      (abonnement.finLe.getTime() - abonnement.debutLe.getTime()) / 86_400_000,
    ),
  );
  const ecoules = Math.min(100, Math.max(0, Math.round(((total - restants) / total) * 100)));

  // Seuils d'alerte : sous 7 jours le gerant doit relancer.
  const ton = restants <= 3 ? "danger" : restants <= 7 ? "alerte" : "succes";
  const couleurJauge =
    restants <= 3 ? "bg-danger" : restants <= 7 ? "bg-warning" : "bg-brand";

  return (
    <Card>
      <CardHeader
        titre="Abonnement en cours"
        icone={<CalendarClock className="size-4 text-brand" />}
        action={
          <div className="flex items-center gap-2">
            {restants <= SEUIL_RELANCE_JOURS && (
              <a
                href={lienWhatsApp(
                  telephoneAdherent,
                  messageRelanceAbonnement(
                    prenomAdherent,
                    abonnement.nomFormule,
                    nomSalle,
                    abonnement.finLe,
                    restants <= 0,
                  ),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variante="whatsapp" taille="sm">
                  <Send className="size-4" />
                  Rappel WhatsApp
                </Button>
              </a>
            )}
            <BoutonAnnuler
              abonnementId={abonnement.id}
              adherentId={adherentId}
              nomFormule={abonnement.nomFormule}
            />
            <Link href={`/adherents/${adherentId}/abonnement`}>
              <Button variante="contour" taille="sm">
                <RefreshCw className="size-4" />
                Renouveler
              </Button>
            </Link>
          </div>
        }
      />
      <CardBody>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">
            {abonnement.nomFormule}
          </h3>
          <span className="font-semibold text-ink">
            {formatFCFA(abonnement.prixPaye)}
          </span>
        </div>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted">Debut</dt>
            <dd className="text-ink">{formatDateLongue(abonnement.debutLe)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Fin</dt>
            <dd className="font-medium text-ink">
              {formatDateLongue(abonnement.finLe)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-control bg-sunken p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">Jours restants</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink">{restants}</span>
              <Badge ton={ton}>{ecoules} % ecoule</Badge>
            </div>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-pill bg-line"
            role="progressbar"
            aria-valuenow={ecoules}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression de l'abonnement"
          >
            <div
              className={cn("h-full rounded-pill transition-all", couleurJauge)}
              style={{ width: `${ecoules}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">
          Montant et date de fin figes a la souscription : une modification de
          la formule ne les changera pas.
        </p>
      </CardBody>
    </Card>
  );
}
