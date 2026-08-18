// Server Component (CLAUDE.md §7) : ce code s'execute sur le serveur.
import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/ui/logo";
import {
  getTenantContext,
  AucuneSalleActiveError,
  SalleIntrouvableError,
} from "@/lib/tenant";

export default async function PageTableauDeBord() {
  let contexte;
  try {
    contexte = await getTenantContext();
  } catch (erreur) {
    if (erreur instanceof AucuneSalleActiveError) {
      return (
        <Cadre titre="Aucune salle active">
          Utilisez le selecteur en haut a droite pour creer ou selectionner
          votre salle.
        </Cadre>
      );
    }
    if (erreur instanceof SalleIntrouvableError) {
      return (
        <Cadre titre="Salle non initialisee">
          Votre organisation existe dans Clerk, mais sa fiche n&apos;a pas
          encore ete creee en base.{" "}
          <Link
            href="/salle/initialisation"
            className="font-medium text-[#FF6B35] underline"
          >
            Terminer l&apos;initialisation
          </Link>
        </Cadre>
      );
    }
    throw erreur;
  }

  const { gymId, gym, userId, orgRole } = contexte;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo hauteur={28} prioritaire />
        <div className="flex items-center gap-3">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/salle/initialisation"
            afterSelectOrganizationUrl="/salle/initialisation"
          />
          <UserButton />
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#64748B]">Salle active</p>
        <h2 className="mt-1 text-2xl font-bold text-[#0F172A]">{gym.nom}</h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {gym.ville ?? "Ville non renseignee"}
          {" · "}
          {gym.actif ? "Compte actif" : "Compte desactive"}
        </p>

        <dl className="mt-6 divide-y divide-[#E2E8F0] text-sm">
          <Ligne label="gymId (filtre toutes les requetes)" valeur={gymId} mono />
          <Ligne label="clerkOrgId (le pont)" valeur={gym.clerkOrgId} mono />
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
      </section>
    </main>
  );
}

function Cadre({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo hauteur={28} prioritaire />
        <div className="flex items-center gap-3">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/salle/initialisation"
            afterSelectOrganizationUrl="/salle/initialisation"
          />
          <UserButton />
        </div>
      </header>
      <section className="mx-auto mt-8 max-w-3xl rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-6">
        <h2 className="font-semibold text-[#92400E]">{titre}</h2>
        <p className="mt-2 text-sm text-[#92400E]">{children}</p>
      </section>
    </main>
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
      <dt className="text-[#64748B]">{label}</dt>
      <dd
        className={`text-right text-[#1E293B] ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {valeur}
      </dd>
    </div>
  );
}
