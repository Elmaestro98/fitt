import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info as InfoIcon, MapPin, Phone, Users } from "lucide-react";
import { BoutonToggleSalle } from "@/components/admin/bouton-toggle-salle";
import { StatutBadge } from "@/components/admin/table-salles";
import { PanneauEssai } from "@/components/admin/panneau-essai";
import { Card, CardContent } from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { detailSalle } from "@/lib/data/gym";
import { formatDateLongue } from "@/lib/utils/format";
import { formaterTelephoneSalle } from "@/lib/utils/telephone";
import { statutSalle } from "@/lib/utils/salle";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Salle — Administration Fitt" };

export default async function PageDetailSalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resultat = await detailSalle(id);
  if (!resultat) notFound();

  const { salle, abonnementsActifs, staff } = resultat;
  const statut = statutSalle(salle);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-admin-muted hover:text-admin-text"
      >
        <ChevronLeft className="size-4" />
        Retour aux salles
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{salle.nom}</h1>
          <div className="mt-1.5">
            <StatutBadge statut={statut} />
          </div>
        </div>
        <BoutonToggleSalle salle={salle} taille="md" />
      </div>

      {statut === "en_attente" && (
        <Alert className="rounded-control border-admin-accent/30 bg-admin-accent/10 text-admin-text [&>svg]:text-admin-accent">
          <InfoIcon />
          <AlertDescription className="text-admin-text">
            Cette salle vient de creer son organisation et n&apos;a encore
            jamais ete activee. Son staff n&apos;a aucun acces tant que vous
            ne cliquez pas sur « Reactiver ».
          </AlertDescription>
        </Alert>
      )}

      <PanneauEssai salle={salle} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Info
          label="Adherents"
          valeur={String(salle._count.adherents)}
          icone={<Users className="size-3.5" />}
        />
        <Info label="Abonnements actifs" valeur={String(abonnementsActifs)} />
        <Info label="Creee le" valeur={formatDateLongue(salle.creeLe)} />
        <Info
          label="Activee le"
          valeur={salle.activeeLe ? formatDateLongue(salle.activeeLe) : "—"}
        />
      </div>

      <Card className="gap-0 rounded-card border-admin-line bg-admin-surface py-4 text-admin-text">
        <CardContent className="px-4">
          <p className="text-sm font-medium">Coordonnees</p>
          <div className="mt-3 space-y-2 text-sm text-admin-muted">
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              {salle.telephone
                ? formaterTelephoneSalle(salle.telephone)
                : "Aucun telephone renseigne"}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {[salle.adresse, salle.ville].filter(Boolean).join(", ") ||
                "Aucune adresse renseignee"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-card border-admin-line bg-admin-surface py-4 text-admin-text">
        <CardContent className="px-4">
          <p className="text-sm font-medium">Staff ({staff.length})</p>
          <p className="mt-0.5 text-xs text-admin-muted">
            Comptes Clerk membres de cette organisation.
          </p>

          {staff.length === 0 ? (
            <p className="mt-4 text-sm text-admin-muted">
              Personne n&apos;a encore rejoint cette organisation.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-admin-line">
              {staff.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.nom}</p>
                    <p className="truncate text-xs text-admin-muted">
                      {m.email}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-pill border-transparent px-2.5 py-1 font-medium",
                      m.role === "Admin"
                        ? "bg-admin-accent/15 text-admin-accent"
                        : "bg-admin-line text-admin-muted",
                    )}
                  >
                    {m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  label,
  valeur,
  icone,
}: {
  label: string;
  valeur: string;
  icone?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-card border-admin-line bg-admin-surface py-3 text-admin-text">
      <CardContent className="px-4">
        <p className="flex items-center gap-1.5 font-[family-name:var(--font-mono-admin)] text-lg font-medium tabular-nums">
          {icone}
          {valeur}
        </p>
        <p className="mt-0.5 text-xs text-admin-muted">{label}</p>
      </CardContent>
    </Card>
  );
}
