"use client";

// Recherche et filtre par statut. Composant client : il ecoute la frappe.
//
// Les criteres vivent dans l'URL (?recherche=diop&statut=EXPIRE), pas dans un
// useState : une recherche devient partageable, remise en favori, et le bouton
// "retour" du navigateur fonctionne. La page reste un Server Component qui lit
// simplement ses searchParams.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STATUTS = [
  { valeur: "", libelle: "Tous" },
  { valeur: "ACTIF", libelle: "Actifs" },
  { valeur: "EXPIRE", libelle: "Expires" },
  { valeur: "SUSPENDU", libelle: "Suspendus" },
  { valeur: "ARCHIVE", libelle: "Archives" },
] as const;

export function BarreFiltres() {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrerTransition] = useTransition();

  const rechercheUrl = params.get("recherche") ?? "";
  const statutUrl = params.get("statut") ?? "";
  const [saisie, setSaisie] = useState(rechercheUrl);

  // Si l'URL change ailleurs (retour arriere, clic sur un filtre), on
  // resynchronise le champ.
  useEffect(() => setSaisie(rechercheUrl), [rechercheUrl]);

  function naviguer(modif: Record<string, string>) {
    const suivants = new URLSearchParams(params.toString());
    for (const [cle, valeur] of Object.entries(modif)) {
      if (valeur) suivants.set(cle, valeur);
      else suivants.delete(cle);
    }
    // Tout changement de critere ramene a la page 1 : rester page 3 d'une
    // recherche qui n'a plus qu'une page afficherait un ecran vide.
    suivants.delete("page");
    demarrerTransition(() => router.push(`/adherents?${suivants}`));
  }

  // Anti-rebond : on attend 350 ms sans frappe avant d'interroger le serveur.
  // Sans ca, "Diop" declencherait quatre requetes.
  useEffect(() => {
    if (saisie === rechercheUrl) return;
    const minuteur = setTimeout(() => naviguer({ recherche: saisie }), 350);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisie]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Nom, numero, telephone..."
          aria-label="Rechercher un adherent"
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
        {STATUTS.map((s) => (
          <button
            key={s.valeur}
            type="button"
            onClick={() => naviguer({ statut: s.valeur })}
            className={cn(
              "h-9 min-h-9 rounded-pill px-3 text-sm whitespace-nowrap transition-colors",
              statutUrl === s.valeur
                ? "bg-ink font-medium text-white"
                : "bg-surface text-muted hover:bg-sunken hover:text-ink",
            )}
          >
            {s.libelle}
          </button>
        ))}
      </div>
    </div>
  );
}
