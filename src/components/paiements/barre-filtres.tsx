"use client";

// Recherche, periode et methode du journal de caisse. Comme ailleurs, les
// criteres vivent dans l'URL et non dans un useState : la vue "recette du
// jour, especes" devient une adresse que le gerant met en favori.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PERIODES = [
  { valeur: "jour", libelle: "Aujourd'hui" },
  { valeur: "semaine", libelle: "Cette semaine" },
  { valeur: "mois", libelle: "Ce mois" },
  { valeur: "", libelle: "Tout" },
] as const;

const METHODES = [
  { valeur: "", libelle: "Toutes" },
  { valeur: "ESPECES", libelle: "Especes" },
  { valeur: "WAVE", libelle: "Wave" },
  { valeur: "ORANGE_MONEY", libelle: "Orange Money" },
] as const;

export function BarreFiltres() {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrerTransition] = useTransition();

  const rechercheUrl = params.get("recherche") ?? "";
  const periodeUrl = params.get("periode") ?? "";
  const methodeUrl = params.get("methode") ?? "";
  const [saisie, setSaisie] = useState(rechercheUrl);

  useEffect(() => setSaisie(rechercheUrl), [rechercheUrl]);

  function naviguer(modif: Record<string, string>) {
    const suivants = new URLSearchParams(params.toString());
    for (const [cle, valeur] of Object.entries(modif)) {
      if (valeur) suivants.set(cle, valeur);
      else suivants.delete(cle);
    }
    // Tout changement de critere ramene a la page 1.
    suivants.delete("page");
    demarrerTransition(() => router.push(`/paiements?${suivants}`));
  }

  // Anti-rebond de 350 ms : sans lui, chaque frappe partirait au serveur.
  useEffect(() => {
    if (saisie === rechercheUrl) return;
    const minuteur = setTimeout(() => naviguer({ recherche: saisie }), 350);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisie]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center",
        enCours && "opacity-60 transition-opacity",
      )}
    >
      <div className="relative flex-1 lg:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Adherent, numero, reference..."
          aria-label="Rechercher un paiement"
          className="h-11 w-full rounded-control border border-line bg-surface pr-9 pl-9 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        />
        {saisie && (
          <button
            type="button"
            onClick={() => setSaisie("")}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {PERIODES.map((p) => (
          <Pastille
            key={p.valeur}
            actif={periodeUrl === p.valeur}
            onClick={() => naviguer({ periode: p.valeur })}
          >
            {p.libelle}
          </Pastille>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto lg:ml-auto">
        {METHODES.map((m) => (
          <Pastille
            key={m.valeur}
            actif={methodeUrl === m.valeur}
            onClick={() => naviguer({ methode: m.valeur })}
          >
            {m.libelle}
          </Pastille>
        ))}
      </div>
    </div>
  );
}

function Pastille({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 min-h-9 rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
        actif
          ? "bg-ink font-medium text-white"
          : "bg-surface text-muted hover:bg-sunken hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
