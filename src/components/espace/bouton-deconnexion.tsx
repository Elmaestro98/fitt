"use client";

// Deconnexion de l'espace adherent.
//
// Indispensable, et pas seulement par principe : au Senegal un telephone est
// souvent partage. Quelqu'un qui prete le sien doit pouvoir fermer son espace.
//
// /!\ La session est fermee EN BASE, pas seulement effacee du navigateur : un
// jeton qui traine ailleurs ne doit pas rester valable 90 jours.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { actionDeconnecterAdherent } from "@/lib/actions/espace-adherent";

export function BoutonDeconnexion({
  /** Dans la barre haute : icone seule, sans libelle. */
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  function deconnecter() {
    demarrer(async () => {
      await actionDeconnecterAdherent();
      router.refresh();
      router.push("/espace/acces");
    });
  }

  const Icone = enCours ? Loader2 : LogOut;

  return (
    <button
      type="button"
      onClick={deconnecter}
      disabled={enCours}
      // 44 px de cible tactile au minimum, meme en mode compact (§11).
      className={cn(
        "flex items-center gap-2 rounded-control text-muted hover:text-ink disabled:opacity-60",
        compact ? "size-11 justify-center" : "mx-auto h-11 px-4 text-xs",
      )}
      aria-label={compact ? "Me deconnecter" : undefined}
      title={compact ? "Me deconnecter" : undefined}
    >
      <Icone className={cn("size-4", enCours && "animate-spin")} />
      {!compact && "Me deconnecter"}
    </button>
  );
}
