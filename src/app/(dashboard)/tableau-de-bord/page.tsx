// Server Component (CLAUDE.md §7). La barre laterale et la barre haute
// viennent du layout de (dashboard) : cette page n'ecrit que son contenu.
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  getTenantContext,
  AucuneSalleActiveError,
  SalleIntrouvableError,
} from "@/lib/tenant";

/* Date du jour, en francais et au fuseau de Dakar (CLAUDE.md §8). */
function aujourdhui() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(new Date());
}

export default async function PageTableauDeBord() {
  let contexte;
  try {
    contexte = await getTenantContext();
  } catch (erreur) {
    if (erreur instanceof AucuneSalleActiveError) {
      return (
        <Avertissement titre="Aucune salle active">
          Utilisez le selecteur de salle en haut a droite pour creer ou
          selectionner votre salle.
        </Avertissement>
      );
    }
    if (erreur instanceof SalleIntrouvableError) {
      return (
        <Avertissement titre="Salle non initialisee">
          Votre organisation existe, mais sa fiche n&apos;a pas encore ete
          creee.{" "}
          <Link
            href="/salle/initialisation"
            className="font-medium text-brand underline"
          >
            Terminer l&apos;initialisation
          </Link>
        </Avertissement>
      );
    }
    throw erreur;
  }

  const { gymId, gym, userId, orgRole } = contexte;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Vue d'ensemble"
        sousTitre={`Aujourd'hui, ${aujourdhui()}`}
        action={
          <Link href="/adherents/nouveau">
            <Button>
              <Plus className="size-4" />
              Nouvel adherent
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader
          titre={gym.nom}
          icone={<Building2 className="size-4 text-brand" />}
        />
        <CardBody>
          <p className="text-sm text-muted">
            {gym.ville ?? "Ville non renseignee"}
            {" · "}
            {gym.actif ? "Compte actif" : "Compte desactive"}
          </p>

          <dl className="mt-5 divide-y divide-line text-sm">
            <Ligne label="gymId (filtre toutes les requetes)" valeur={gymId} mono />
            <Ligne label="clerkOrgId (le pont vers Clerk)" valeur={gym.clerkOrgId} mono />
            <Ligne label="userId" valeur={userId} mono />
            <Ligne label="Votre role" valeur={orgRole ?? "—"} mono />
            <Ligne
              label="Salle creee le"
              valeur={new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "Africa/Dakar",
              }).format(gym.creeLe)}
            />
          </dl>

          <p className="mt-5 rounded-control bg-sunken p-3 text-sm text-muted">
            Les indicateurs, le graphe de revenus et la liste des abonnements
            expirants arriveront avec la table Adherent.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function Avertissement({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-warning/40 bg-warning-soft">
      <CardBody className="pt-5">
        <h2 className="font-semibold text-ink">{titre}</h2>
        <p className="mt-2 text-sm text-ink/80">{children}</p>
      </CardBody>
    </Card>
  );
}

function Ligne({
  label,
  valeur,
  mono = false,
}: {
  label: string;
  valeur: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`text-right text-ink ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {valeur}
      </dd>
    </div>
  );
}
