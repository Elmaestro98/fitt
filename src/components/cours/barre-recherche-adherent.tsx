"use client";

// Recherche d'un adherent a inscrire sur une seance. Meme principe que
// BarreFiltres (components/adherents) : le critere vit dans l'URL, pas dans
// un useState local, avec un anti-rebond de 350 ms.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

export function BarreRechercheAdherent({ basePath }: { basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, demarrerTransition] = useTransition();

  const rechercheUrl = params.get("recherche") ?? "";
  const [saisie, setSaisie] = useState(rechercheUrl);

  useEffect(() => setSaisie(rechercheUrl), [rechercheUrl]);

  useEffect(() => {
    if (saisie === rechercheUrl) return;
    const minuteur = setTimeout(() => {
      const q = new URLSearchParams();
      if (saisie) q.set("recherche", saisie);
      demarrerTransition(() => router.push(`${basePath}?${q}`));
    }, 350);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisie]);

  return (
    <div className="relative">
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
  );
}
