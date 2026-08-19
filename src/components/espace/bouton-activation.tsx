"use client";

// Le bouton qui consomme reellement l'invitation.
//
// /!\ Il porte a lui seul la regle de l'usage unique (§4) : tant qu'il n'est
// pas clique, le lien reste intact. C'est ce qui protege l'adherent des robots
// d'apercu de lien de WhatsApp, qui ouvrent l'URL avant lui.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire } from "@/components/ui/form";
import { actionActiverEspace } from "@/lib/actions/espace-adherent";

const MESSAGES = {
  introuvable: "Ce lien n'est pas valide. Demandez-en un nouveau a votre salle.",
  expire: "Ce lien a expire. Demandez-en un nouveau a l'accueil.",
  revoque: "Ce lien a ete annule par votre salle.",
  utilise:
    "Cet acces a deja ete active depuis un autre telephone. Demandez un nouveau lien.",
  statut: "Votre inscription doit d'abord etre validee par votre salle.",
} as const;

export function BoutonActivation({ jeton }: { jeton: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function activer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = await actionActiverEspace(jeton);

      if (resultat.succes) {
        // refresh() avant push() : le cookie vient d'etre pose, le cache
        // client ignore encore la session.
        router.refresh();
        router.push("/espace");
        return;
      }

      setErreur(
        resultat.raison
          ? MESSAGES[resultat.raison]
          : (resultat.message ?? "L'activation a echoue. Reessayez."),
      );
    });
  }

  return (
    <div className="space-y-3">
      {erreur && <AlerteFormulaire>{erreur}</AlerteFormulaire>}

      <Button
        type="button"
        onClick={activer}
        disabled={enCours}
        // Cible tactile confortable : ce bouton est le premier contact de
        // l'adherent avec le produit (§11).
        className="h-12 w-full"
      >
        {enCours ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {enCours ? "Activation..." : "Activer mon espace"}
      </Button>
    </div>
  );
}
