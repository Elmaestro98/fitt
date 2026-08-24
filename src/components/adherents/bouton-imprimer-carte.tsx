"use client";

// window.print() n'existe que cote navigateur : seul point du parcours qui
// impose un composant client, tout le reste de la page carte/ reste serveur.
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoutonImprimerCarte() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="size-4" />
      Imprimer la carte
    </Button>
  );
}
