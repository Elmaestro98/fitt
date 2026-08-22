// Accueil de l'espace adherent.
//
// Une seule question compte pour qui ouvre cette page dans le vestiaire : "il
// me reste combien de jours ?". Elle occupe donc le haut de l'ecran, en gros,
// avant tout le reste.
//
// La session est deja resolue par le layout du groupe (connecte) ; les
// fonctions de data/espace.ts la redemandent de toute facon, chacune restant
// ainsi sure prise isolement (§3).
import Link from "next/link";
import { CalendarCheck, ChevronRight, CreditCard, ScanLine } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { accueilEspace } from "@/lib/data/espace";
import { formatDate, formatDateHeure } from "@/lib/utils/format";
import { joursRestants } from "@/lib/utils/duree";

export default async function PageEspace() {
  const {
    adherent,
    gym,
    abonnement,
    seancesCeMois,
    derniereSeance,
    dejaPointeAujourdhui,
  } = await accueilEspace();

  const jours = abonnement ? joursRestants(abonnement.finLe) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        titre={`Bonjour ${adherent.prenom}`}
        sousTitre={`${gym.nom}${gym.ville ? ` — ${gym.ville}` : ""}`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CarteEcheance jours={jours} abonnement={abonnement} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Seances ce mois"
            valeur={String(seancesCeMois)}
            icone={<CalendarCheck className="size-4" />}
            teinte="success"
            precision="depuis le 1er du mois"
          />
          <StatCard
            label="Derniere venue"
            valeur={derniereSeance ? formatDate(derniereSeance) : "—"}
            icone={<ScanLine className="size-4" />}
            precision={
              derniereSeance
                ? formatDateHeure(derniereSeance)
                : "aucun passage enregistre"
            }
          />
        </div>
      </div>

      <div className="cascade grid gap-4 sm:grid-cols-3">
        <Raccourci
          href="/espace/pointer"
          icone={<ScanLine className="size-5 text-brand" />}
          titre={
            dejaPointeAujourdhui
              ? "Presence enregistree"
              : "Signaler ma presence"
          }
          detail={
            dejaPointeAujourdhui
              ? "Votre venue du jour est prise en compte."
              : "Avec le code affiche a l'accueil."
          }
          accent
        />
        <Raccourci
          href="/espace/seances"
          icone={<CalendarCheck className="size-5 text-muted" />}
          titre="Mes seances"
          detail="Toutes vos venues, mois par mois."
        />
        <Raccourci
          href="/espace/abonnements"
          icone={<CreditCard className="size-5 text-muted" />}
          titre="Mes abonnements"
          detail="Votre formule et son historique."
        />
      </div>
    </div>
  );
}

/* --- L'echeance, la seule information que l'adherent vient chercher -------- */

function CarteEcheance({
  jours,
  abonnement,
}: {
  jours: number | null;
  abonnement: { nomFormule: string; debutLe: Date; finLe: Date } | null;
}) {
  if (!abonnement || jours === null) {
    return (
      <Card className="h-full border-danger/40">
        <CardBody className="flex h-full flex-col justify-center py-10 text-center">
          <p className="text-xl font-semibold text-ink">Aucun abonnement</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Passez a l&apos;accueil de votre salle pour souscrire ou renouveler.
            Vous restez le bienvenu a la salle en attendant.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Trois seuils, trois couleurs. Le §11 reserve l'alerte a l'echeance proche
  // et le danger a l'expiration depassee.
  const ton =
    jours <= 0
      ? "border-danger/40 bg-danger-soft"
      : jours <= 7
        ? "border-warning/40 bg-warning-soft"
        : "border-success/40 bg-success-soft";

  return (
    <Card className={`h-full ${ton}`}>
      <CardBody className="flex h-full flex-col justify-center py-10 text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {abonnement.nomFormule}
        </p>
        <p className="mt-2 text-6xl font-bold text-ink tabular-nums">
          {jours > 0 ? jours : 0}
        </p>
        <p className="mt-1 text-sm font-medium text-ink">
          {jours > 1 ? "jours restants" : "jour restant"}
        </p>
        <p className="mt-3 text-xs text-muted">
          {jours > 0
            ? `Du ${formatDate(abonnement.debutLe)} au ${formatDate(abonnement.finLe)}`
            : `Termine le ${formatDate(abonnement.finLe)} — pensez a renouveler`}
        </p>
      </CardBody>
    </Card>
  );
}

function Raccourci({
  href,
  icone,
  titre,
  detail,
  accent = false,
}: {
  href: string;
  icone: React.ReactNode;
  titre: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition hover:border-brand/40">
        <CardBody className="flex items-center gap-3 py-4">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              accent ? "bg-brand-soft" : "bg-sunken"
            }`}
          >
            {icone}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">{titre}</span>
            <span className="block text-xs text-muted">{detail}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </CardBody>
      </Card>
    </Link>
  );
}
