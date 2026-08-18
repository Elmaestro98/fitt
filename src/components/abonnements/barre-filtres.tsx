"use client";

// Recherche et onglets de la liste des abonnements. Meme principe que la barre
// des adherents : les criteres vivent dans l'URL, pas dans un useState, pour
// que la vue soit partageable et que le bouton "retour" fonctionne.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const VUES = [
  { valeur: "", libelle: "Tous", cle: "tous" },
  { valeur: "en-cours", libelle: "En cours", cle: "en-cours" },
  { valeur: "bientot", libelle: "Expire sous 7 j", cle: "bientot" },
  { valeur: "expires", libelle: "Termines", cle: "expires" },
  { valeur: "annules", libelle: "Annules", cle: "annules" },
] as const;

export function BarreFiltres({
  compteurs,
}: {
  compteurs: Record<string, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrerTransition] = useTransition();

  const rechercheUrl = params.get("recherche") ?? "";
  const vueUrl = params.get("vue") ?? "";
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
    demarrerTransition(() => router.push(`/abonnements?${suivants}`));
  }

  // Anti-rebond de 350 ms : sans lui, "Diop" declencherait quatre requetes.
  useEffect(() => {
    if (saisie === rechercheUrl) return;
    const minuteur = setTimeout(() => naviguer({ recherche: saisie }), 350);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisie]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Adherent, numero, formule..."
          aria-label="Rechercher un abonnement"
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

      <div
        className={cn(
          "flex gap-1 overflow-x-auto",
          enCours && "opacity-60 transition-opacity",
        )}
      >
        {VUES.map((v) => {
          const actif = vueUrl === v.valeur;
          const nombre = compteurs[v.cle] ?? 0;
          return (
            <button
              key={v.cle}
              type="button"
              onClick={() => naviguer({ vue: v.valeur })}
              className={cn(
                "flex h-9 min-h-9 items-center gap-1.5 rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
                actif
                  ? "bg-ink font-medium text-white"
                  : "bg-surface text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              {v.libelle}
              <span
                className={cn(
                  "rounded-pill px-1.5 text-xs tabular-nums",
                  actif ? "bg-white/20 text-white" : "bg-sunken text-muted",
                  // L'onglet d'alerte porte sa couleur meme au repos : c'est
                  // le seul chiffre sur lequel le gerant doit agir aujourd'hui.
                  !actif && v.cle === "bientot" && nombre > 0
                    ? "bg-warning-soft text-warning"
                    : "",
                )}
              >
                {nombre}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
