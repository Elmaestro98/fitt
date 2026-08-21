"use client";

// Bouton Suspendre/Reactiver d'une salle, partage entre le tableau et la
// fiche detaillee. Suspendre exige une confirmation (ca coupe l'acces d'un
// client payant) ; reactiver n'en a pas besoin, c'est sans risque.
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { useAdminPortalContainer } from "@/components/admin/admin-theme-context";
import { actionBasculerActivationSalle } from "@/lib/actions/admin";

export function BoutonToggleSalle({
  salle,
  taille = "sm",
}: {
  salle: { id: string; nom: string; actif: boolean };
  taille?: "sm" | "md";
}) {
  const conteneur = useAdminPortalContainer();

  if (!salle.actif) {
    return (
      <form action={actionBasculerActivationSalle}>
        <input type="hidden" name="id" value={salle.id} />
        <input type="hidden" name="actif" value="true" />
        <Button
          type="submit"
          variant="ghost"
          size={taille === "sm" ? "sm" : "default"}
          className="text-admin-success hover:bg-admin-success/10 hover:text-admin-success focus-visible:ring-admin-success"
        >
          Reactiver
        </Button>
      </form>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={taille === "sm" ? "sm" : "default"}
          className="text-admin-danger hover:bg-admin-danger/10 hover:text-admin-danger focus-visible:ring-admin-danger"
        >
          Suspendre
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent
        container={conteneur}
        className="border-admin-line bg-admin-surface text-admin-text sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Suspendre cette salle</AlertDialogTitle>
          <AlertDialogDescription className="truncate text-admin-muted">
            {salle.nom}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert className="rounded-control border-admin-accent/30 bg-admin-accent/10 text-admin-text [&>svg]:text-admin-accent">
          <ShieldOff />
          <AlertDescription className="text-admin-text/80">
            <p>
              Tout le staff de <strong>{salle.nom}</strong> perd l&apos;acces
              immediatement. Les donnees restent intactes — la salle peut
              etre reactivee a tout moment.
            </p>
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-admin-line bg-transparent text-admin-text hover:bg-admin-surface-hover">
            Annuler
          </AlertDialogCancel>
          <form action={actionBasculerActivationSalle}>
            <input type="hidden" name="id" value={salle.id} />
            <input type="hidden" name="actif" value="false" />
            <AlertDialogAction
              type="submit"
              className="w-full bg-admin-danger text-white hover:bg-admin-danger/90"
            >
              Confirmer la suspension
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
