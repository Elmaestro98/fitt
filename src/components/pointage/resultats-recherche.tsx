"use client";

// Liste des adherents correspondant a la saisie. Chaque ligne est un bouton
// de 56 px de haut : on pointe au doigt, sur un telephone pose a l'accueil
// (cibles >= 44 px, CLAUDE.md §11).
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { AdherentKiosque } from "@/lib/data/pointage";
import { joursRestants } from "@/lib/utils/duree";
import { cn } from "@/lib/utils/cn";

export function ResultatsRecherche({
  adherents,
  onChoisir,
}: {
  adherents: AdherentKiosque[];
  onChoisir: (adherent: AdherentKiosque) => void;
}) {
  return (
    <ul className="divide-y divide-line">
      {adherents.map((a) => {
        const fin = a.finLe ? new Date(a.finLe) : null;
        const restants = fin ? joursRestants(fin) : null;
        const couvert =
          a.statut === "ACTIF" && restants !== null && restants > 0;

        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onChoisir(a)}
              className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none"
            >
              <Avatar
                nom={`${a.prenom} ${a.nom}`}
                photoUrl={a.photoUrl}
                taille="md"
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">
                  {a.prenom} {a.nom}
                </span>
                <span className="block font-mono text-xs text-muted">
                  {a.numero}
                </span>
              </span>

              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  couvert ? "text-success" : "text-danger",
                )}
              >
                {couvert
                  ? `${restants} j restants`
                  : a.statut === "SUSPENDU"
                    ? "Suspendu"
                    : "Expire"}
              </span>

              <ChevronRight className="size-4 shrink-0 text-muted" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
