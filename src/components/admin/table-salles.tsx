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
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatDate } from "@/lib/utils/format";
import { detailEssai, LIBELLES_STATUT_SALLE, statutSalle } from "@/lib/utils/salle";
import { cn } from "@/lib/utils/cn";

type Salle = {
  id: string;
  nom: string;
  ville: string | null;
  actif: boolean;
  activeeLe: Date | null;
  essaiJusquau: Date | null;
  abonnee: boolean;
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
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted" />
        <Input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Filtrer par nom ou ville..."
          aria-label="Filtrer les salles"
          className={cn(
            "h-10 rounded-control border-admin-line bg-admin-surface",
            "pr-3 pl-9 text-sm text-admin-text placeholder:text-admin-muted",
            "focus-visible:border-admin-accent focus-visible:ring-admin-accent/30",
          )}
        />
      </div>

      <div className="overflow-hidden rounded-card border border-admin-line">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="border-admin-line text-xs tracking-wide text-admin-muted uppercase hover:bg-transparent">
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
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-0">
            {lignes.map((s) => {
              const statut = statutSalle(s);
              return (
                <TableRow
                  key={s.id}
                  className="border-admin-line transition-colors hover:bg-admin-surface-hover"
                >
                  <TableCell className="py-3 font-medium whitespace-nowrap">
                    <Link
                      href={`/admin/${s.id}`}
                      className="hover:text-admin-accent hover:underline"
                    >
                      {s.nom}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 text-admin-muted">
                    {s.ville ?? "—"}
                  </TableCell>
                  <TableCell className="py-3 text-right font-[family-name:var(--font-mono-admin)] tabular-nums">
                    {s._count.adherents}
                  </TableCell>
                  <TableCell className="py-3 font-[family-name:var(--font-mono-admin)] text-admin-muted">
                    {formatDate(s.creeLe)}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatutBadge statut={statut} />
                    {detailEssai(s) && (
                      <span className="mt-0.5 block font-[family-name:var(--font-mono-admin)] text-[11px] text-admin-muted">
                        {detailEssai(s)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <BoutonToggleSalle salle={s} />
                  </TableCell>
                </TableRow>
              );
            })}

            {lignes.length === 0 && (
              <TableRow className="border-admin-line hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-admin-muted"
                >
                  Aucune salle ne correspond a « {recherche} ».
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StatutBadge({
  statut,
}: {
  statut: ReturnType<typeof statutSalle>;
}) {
  // Vert : la salle tourne et rapporte. Orange : elle demande une decision
  // (activer, relancer, encaisser). Rouge : l'acces est coupe.
  const ton =
    statut === "abonnee" || statut === "active"
      ? "succes"
      : statut === "essai" || statut === "en_attente"
        ? "attention"
        : "danger";

  const couleur =
    ton === "succes"
      ? "bg-admin-success pouls-admin"
      : ton === "attention"
        ? "bg-admin-accent"
        : "bg-admin-danger";
  const texte =
    ton === "succes"
      ? "text-admin-success"
      : ton === "attention"
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
    <TableHead
      className={cn("py-3 font-medium", align === "right" && "text-right")}
    >
      {children}
    </TableHead>
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
    <TableHead
      className={cn("py-3 font-medium", align === "right" && "text-right")}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          "h-auto gap-1 p-0 text-xs font-medium tracking-wide text-admin-muted uppercase hover:bg-transparent hover:text-admin-text",
          align === "right" && "flex-row-reverse",
          actif && "text-admin-text",
        )}
      >
        {children}
        <Icone className="size-3" />
      </Button>
    </TableHead>
  );
}
