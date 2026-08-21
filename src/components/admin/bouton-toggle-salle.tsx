"use client";

// Bouton Suspendre/Reactiver d'une salle, partage entre le tableau et la
// fiche detaillee. Suspendre exige une confirmation (ca coupe l'acces d'un
// client payant) ; reactiver n'en a pas besoin, c'est sans risque.
import { useState } from "react";
import { ShieldOff, X } from "lucide-react";
import { Modale } from "@/components/ui/modale";
import { actionBasculerActivationSalle } from "@/lib/actions/admin";

export function BoutonToggleSalle({
  salle,
  taille = "sm",
}: {
  salle: { id: string; nom: string; actif: boolean };
  taille?: "sm" | "md";
}) {
  const [confirmer, setConfirmer] = useState(false);

  const classesBase =
    taille === "sm"
      ? "rounded-control px-3 py-1.5 text-xs font-medium"
      : "rounded-control px-4 py-2 text-sm font-medium";

  if (!salle.actif) {
    return (
      <form action={actionBasculerActivationSalle}>
        <input type="hidden" name="id" value={salle.id} />
        <input type="hidden" name="actif" value="true" />
        <button
          type="submit"
          className={`${classesBase} text-admin-success hover:bg-admin-success/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-success`}
        >
          Reactiver
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmer(true)}
        className={`${classesBase} text-admin-danger hover:bg-admin-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-danger`}
      >
        Suspendre
      </button>

      <Modale
        ouvert={confirmer}
        onFermer={() => setConfirmer(false)}
        titre="Suspendre cette salle"
        sousTitre={salle.nom}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-control bg-warning-soft px-4 py-3">
            <ShieldOff className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-sm text-ink/80">
              Tout le staff de <strong>{salle.nom}</strong> perd l&apos;acces
              immediatement. Les donnees restent intactes — la salle peut
              etre reactivee a tout moment.
            </p>
          </div>

          <form
            action={actionBasculerActivationSalle}
            onSubmit={() => setConfirmer(false)}
            className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
          >
            <input type="hidden" name="id" value={salle.id} />
            <input type="hidden" name="actif" value="false" />
            <button
              type="button"
              onClick={() => setConfirmer(false)}
              className="rounded-control border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-sunken"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-control border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-medium text-danger hover:bg-danger/15"
            >
              <X className="size-4" />
              Confirmer la suspension
            </button>
          </form>
        </div>
      </Modale>
    </>
  );
}
