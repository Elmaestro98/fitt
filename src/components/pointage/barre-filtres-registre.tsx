"use client";

// Filtres du registre de presence.
//
// Comme le journal de caisse, les criteres vivent dans l'URL et non dans un
// useState : "les passages du 3 septembre" devient une adresse que le gerant
// met en favori, ouvre dans un onglet, ou envoie a son comptable.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** "2026-09-03" pour aujourd'hui + decalage, en UTC (Dakar y est toute
 *  l'annee, §8) : la borne du navigateur et celle du serveur designent ainsi
 *  exactement la meme journee. */
function isoJour(decalageJours = 0): string {
  const maintenant = new Date();
  const jour = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate() + decalageJours,
    ),
  );
  return jour.toISOString().slice(0, 10);
}

/* Raccourcis de periode. Ils ne font qu'ecrire dans `du` et `au` : il n'y a
   qu'UNE notion de periode dans cet ecran, celle des deux dates. Un troisieme
   parametre "periode" qui aurait cohabite avec elles aurait fini par les
   contredire. */
const RACCOURCIS = [
  { libelle: "Aujourd'hui", du: () => isoJour(), au: () => isoJour() },
  { libelle: "7 jours", du: () => isoJour(-6), au: () => isoJour() },
  { libelle: "30 jours", du: () => isoJour(-29), au: () => isoJour() },
  { libelle: "Tout", du: () => "", au: () => "" },
] as const;

const SOURCES = [
  { valeur: "", libelle: "Toutes" },
  { valeur: "KIOSQUE", libelle: "Borne" },
  { valeur: "STAFF", libelle: "Reception" },
  { valeur: "ADHERENT", libelle: "Espace adherent" },
] as const;

export function BarreFiltresRegistre() {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, demarrerTransition] = useTransition();

  const rechercheUrl = params.get("recherche") ?? "";
  const duUrl = params.get("du") ?? "";
  const auUrl = params.get("au") ?? "";
  const sourceUrl = params.get("source") ?? "";

  const [saisie, setSaisie] = useState(rechercheUrl);
  useEffect(() => setSaisie(rechercheUrl), [rechercheUrl]);

  function naviguer(modif: Record<string, string>) {
    const suivants = new URLSearchParams(params.toString());
    for (const [cle, valeur] of Object.entries(modif)) {
      if (valeur) suivants.set(cle, valeur);
      else suivants.delete(cle);
    }
    // Tout changement de critere ramene a la page 1 : rester en page 4 d'une
    // selection qui n'en compte plus qu'une afficherait un tableau vide.
    suivants.delete("page");
    demarrerTransition(() => router.push(`/pointage/registre?${suivants}`));
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
        "space-y-3",
        enCours && "opacity-60 transition-opacity",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Nom, numero, telephone..."
            aria-label="Rechercher un adherent dans le registre"
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
          {RACCOURCIS.map((r) => {
            const du = r.du();
            const au = r.au();
            return (
              <Pastille
                key={r.libelle}
                actif={duUrl === du && auUrl === au}
                onClick={() => naviguer({ du, au })}
              >
                {r.libelle}
              </Pastille>
            );
          })}
        </div>

        <div className="flex gap-1 overflow-x-auto lg:ml-auto">
          {SOURCES.map((s) => (
            <Pastille
              key={s.valeur}
              actif={sourceUrl === s.valeur}
              onClick={() => naviguer({ source: s.valeur })}
            >
              {s.libelle}
            </Pastille>
          ))}
        </div>
      </div>

      {/* Les dates exactes, sous les raccourcis : "qui est venu le 3
          septembre ?" ne se repond pas avec "7 jours". */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="registre-du" className="text-muted">
          Du
        </label>
        <ChampDate
          id="registre-du"
          valeur={duUrl}
          // Une borne de debut posee apres la fin donnerait une selection
          // vide sans rien expliquer : le champ lui-meme l'interdit.
          max={auUrl || undefined}
          onChange={(v) => naviguer({ du: v })}
        />
        <label htmlFor="registre-au" className="text-muted">
          au
        </label>
        <ChampDate
          id="registre-au"
          valeur={auUrl}
          min={duUrl || undefined}
          onChange={(v) => naviguer({ au: v })}
        />

        {(duUrl || auUrl || sourceUrl || rechercheUrl) && (
          <button
            type="button"
            onClick={() =>
              naviguer({ du: "", au: "", source: "", recherche: "" })
            }
            className="ml-1 inline-flex h-9 min-h-9 items-center gap-1 rounded-control px-2 text-muted hover:text-ink"
          >
            <X className="size-4" />
            Tout effacer
          </button>
        )}
      </div>
    </div>
  );
}

function ChampDate({
  id,
  valeur,
  min,
  max,
  onChange,
}: {
  id: string;
  valeur: string;
  min?: string;
  max?: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <input
      id={id}
      type="date"
      value={valeur}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 min-h-11 rounded-control border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
    />
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
