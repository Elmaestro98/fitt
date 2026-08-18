"use client";

// Etat de la liaison avec le serveur, affiche en permanence sur la borne.
//
// Le ton est volontairement rassurant : une coupure reseau n'est pas une
// panne du pointage (§9). Le personnel d'accueil doit lire "c'est enregistre,
// ca partira tout seul", pas "erreur".
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EtatReseau({
  monte,
  enLigne,
  enAttente,
  synchroEnCours,
  onSynchroniser,
}: {
  /** false pendant le rendu serveur : l'etat reel n'est connu qu'au montage. */
  monte: boolean;
  enLigne: boolean;
  enAttente: number;
  synchroEnCours: boolean;
  onSynchroniser: () => void;
}) {
  // Tant que le composant n'est pas monte, on n'affiche aucun etat : le
  // serveur ignore si le navigateur est en ligne, et deviner provoquerait une
  // erreur d'hydratation (CLAUDE.md §6).
  if (!monte) {
    return <div className="h-12" aria-hidden="true" />;
  }

  const enPanne = !enLigne || enAttente > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-card border px-4 py-3",
        enPanne
          ? "border-warning/40 bg-warning-soft"
          : "border-line bg-surface",
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          enPanne ? "bg-warning/20 text-warning" : "bg-success-soft text-success",
        )}
      >
        {synchroEnCours ? (
          <Loader2 className="size-4 animate-spin" />
        ) : enLigne ? (
          <Cloud className="size-4" />
        ) : (
          <CloudOff className="size-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">
          {enLigne ? "Connecte" : "Hors ligne"}
        </p>
        <p className="text-xs text-muted">
          {enAttente > 0
            ? `${enAttente} passage${enAttente > 1 ? "s" : ""} en attente d'envoi`
            : "Tous les passages sont enregistres"}
        </p>
      </div>

      {enAttente > 0 && (
        <button
          type="button"
          onClick={onSynchroniser}
          disabled={synchroEnCours}
          aria-label="Envoyer maintenant les passages en attente"
          className="flex size-9 items-center justify-center rounded-control text-muted hover:bg-sunken hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", synchroEnCours && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
