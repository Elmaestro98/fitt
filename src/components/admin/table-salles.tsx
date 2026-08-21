"use client";

// Tableau des salles clientes, cote client pour deux raisons :
//   1. le filtre de recherche et le tri sont instantanes, sans aller-retour
//      serveur — la liste tient largement en memoire a l'echelle de ce
//      produit ;
//   2. le bouton Suspendre a besoin d'un etat local (la confirmation), gere
//      par BoutonToggleSalle.
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { BoutonToggleSalle } from "@/components/admin/bouton-toggle-salle";
import { formatDate } from "@/lib/utils/format";
import { LIBELLES_STATUT_SALLE, statutSalle } from "@/lib/utils/salle";
import { cn } from "@/lib/utils/cn";

type Salle = {
  id: string;
  nom: string;
  ville: string | null;
  actif: boolean;
  activeeLe: Date | null;
  creeLe: Date;
  _count: { adherents: number };
};

type Colonne = "nom" | "adherents" | "creeLe";

export function TableSalles({ salles }: { salles: Salle[] }) {
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<{ colonne: Colonne; sens: 1 | -1 }>({
    colonne: "creeLe",
    sens: -1,
  });

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const filtrees = q
      ? salles.filter(
          (s) =>
            s.nom.toLowerCase().includes(q) ||
            (s.ville ?? "").toLowerCase().includes(q),
        )
      : salles;

    return [...filtrees].sort((a, b) => {
      const valeur =
        tri.colonne === "nom"
          ? a.nom.localeCompare(b.nom)
          : tri.colonne === "adherents"
            ? a._count.adherents - b._count.adherents
            : a.creeLe.getTime() - b.creeLe.getTime();
      return valeur * tri.sens;
    });
  }, [recherche, salles, tri]);

  function trierPar(colonne: Colonne) {
    setTri((precedent) =>
      precedent.colonne === colonne
        ? { colonne, sens: precedent.sens === 1 ? -1 : 1 }
        : { colonne, sens: 1 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Filtrer par nom ou ville..."
          aria-label="Filtrer les salles"
          className={cn(
            "h-10 w-full max-w-xs rounded-control border border-admin-line bg-admin-surface",
            "pr-3 pl-9 text-sm text-admin-text placeholder:text-admin-muted",
            "focus:border-admin-accent focus:outline-none",
          )}
        />
      </div>

      <div className="overflow-hidden rounded-card border border-admin-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-admin-line text-left text-xs tracking-wide text-admin-muted uppercase">
                <ThTriable
                  actif={tri.colonne === "nom"}
                  sens={tri.sens}
                  onClick={() => trierPar("nom")}
                >
                  Salle
                </ThTriable>
                <Th>Ville</Th>
                <ThTriable
                  align="right"
                  actif={tri.colonne === "adherents"}
                  sens={tri.sens}
                  onClick={() => trierPar("adherents")}
                >
                  Adherents
                </ThTriable>
                <ThTriable
                  actif={tri.colonne === "creeLe"}
                  sens={tri.sens}
                  onClick={() => trierPar("creeLe")}
                >
                  Creee le
                </ThTriable>
                <Th>Statut</Th>
                <th className="w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-line">
              {lignes.map((s) => {
                const statut = statutSalle(s);
                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-admin-surface-hover"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/${s.id}`}
                        className="hover:text-admin-accent hover:underline"
                      >
                        {s.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-admin-muted">
                      {s.ville ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-[family-name:var(--font-mono-admin)] tabular-nums">
                      {s._count.adherents}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-[family-name:var(--font-mono-admin)] text-admin-muted">
                      {formatDate(s.creeLe)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={statut} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BoutonToggleSalle salle={s} />
                    </td>
                  </tr>
                );
              })}

              {lignes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-admin-muted"
                  >
                    Aucune salle ne correspond a « {recherche} ».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StatutBadge({
  statut,
}: {
  statut: ReturnType<typeof statutSalle>;
}) {
  const couleur =
    statut === "active"
      ? "bg-admin-success pouls-admin"
      : statut === "en_attente"
        ? "bg-admin-accent"
        : "bg-admin-danger";
  const texte =
    statut === "active"
      ? "text-admin-success"
      : statut === "en_attente"
        ? "text-admin-accent"
        : "text-admin-danger";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", couleur)} aria-hidden="true" />
      <span
        className={cn(
          "font-[family-name:var(--font-mono-admin)] text-xs uppercase",
          texte,
        )}
      >
        {LIBELLES_STATUT_SALLE[statut]}
      </span>
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-3 font-medium", align === "right" && "text-right")}>
      {children}
    </th>
  );
}

function ThTriable({
  children,
  align = "left",
  actif,
  sens,
  onClick,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  actif: boolean;
  sens: 1 | -1;
  onClick: () => void;
}) {
  const Icone = !actif ? ArrowUpDown : sens === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-4 py-3 font-medium", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 hover:text-admin-text focus:outline-none",
          align === "right" && "flex-row-reverse",
          actif && "text-admin-text",
        )}
      >
        {children}
        <Icone className="size-3" />
      </button>
    </th>
  );
}
