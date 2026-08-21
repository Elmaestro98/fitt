import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/shadcn/card";
import { TableSalles } from "@/components/admin/table-salles";
import { FormulaireActivationEmail } from "@/components/admin/formulaire-activation-email";
import { Finances } from "@/components/admin/finances";
import { listerToutesLesSalles } from "@/lib/data/gym";
import { financeGlobale } from "@/lib/data/paiement";
import { statutSalle } from "@/lib/utils/salle";

export const metadata = { title: "Administration — Fitt" };

type Params = { [cle: string]: string | string[] | undefined };

export default async function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  // Vient de l'URL, donc pas fiable tel quel : financeGlobale() revalide le
  // format et retombe sur le mois en cours si besoin.
  const moisDemande = typeof params.mois === "string" ? params.mois : undefined;

  const [salles, finances] = await Promise.all([
    listerToutesLesSalles(),
    financeGlobale(moisDemande),
  ]);

  const actives = salles.filter((s) => s.actif).length;
  const enAttente = salles.filter((s) => statutSalle(s) === "en_attente").length;
  const suspendues = salles.filter((s) => statutSalle(s) === "suspendue").length;
  const totalAdherents = salles.reduce((somme, s) => somme + s._count.adherents, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Salles clientes</h1>
        <p className="mt-1 text-sm text-admin-muted">
          Vue d&apos;ensemble des salles Fitt et de leur acces.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Salles actives" valeur={actives} accent="success" />
        <Stat label="En attente" valeur={enAttente} accent="accent" />
        <Stat label="Suspendues" valeur={suspendues} accent="danger" />
        <Stat label="Total salles" valeur={salles.length} />
        <Stat label="Adherents (total)" valeur={totalAdherents} />
      </div>

      <Finances finances={finances} />

      <FormulaireActivationEmail />

      {salles.length === 0 ? (
        <Card className="items-center gap-3 rounded-card border-admin-line bg-transparent py-16 text-center text-admin-text">
          <CardContent className="flex flex-col items-center gap-3">
            <Building2 className="size-6 text-admin-muted" />
            <p className="text-sm text-admin-muted">
              Aucune salle pour le moment. Une salle apparait ici des
              qu&apos;un gerant cree son organisation dans Fitt.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TableSalles salles={salles} />
      )}
    </div>
  );
}

function Stat({
  label,
  valeur,
  accent,
}: {
  label: string;
  valeur: number;
  accent?: "success" | "danger" | "accent";
}) {
  return (
    <Card className="rounded-card border-admin-line bg-admin-surface py-3.5 gap-0 text-admin-text">
      <CardContent className="px-4">
        <p
          className={
            "font-[family-name:var(--font-mono-admin)] text-2xl font-medium tabular-nums " +
            (accent === "success"
              ? "text-admin-success"
              : accent === "danger"
                ? "text-admin-danger"
                : accent === "accent"
                  ? "text-admin-accent"
                  : "text-admin-text")
          }
        >
          {valeur}
        </p>
        <p className="mt-0.5 text-xs text-admin-muted">{label}</p>
      </CardContent>
    </Card>
  );
}
