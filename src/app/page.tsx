// Page publique, accessible sans connexion (declaree dans src/middleware.ts).
// Provisoire : la vraie landing viendra avec sa maquette.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function PageAccueil() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-sidebar px-6 text-center">
      <Logo hauteur={56} prioritaire />

      <div className="max-w-md">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          La gestion de votre salle, sans carnet
        </h1>
        <p className="mt-3 text-sidebar-text">
          Adherents, abonnements, paiements et pointage — au meme endroit,
          depuis votre telephone comme depuis l&apos;accueil.
        </p>
      </div>

      <Link href="/connexion">
        <Button taille="lg">
          Acceder a mon espace
          <ArrowRight className="size-4" />
        </Button>
      </Link>

      <p className="text-xs text-sidebar-text">
        Edite par AFRICATECHNOLOGIE — Saint-Louis, Senegal
      </p>
    </div>
  );
}
