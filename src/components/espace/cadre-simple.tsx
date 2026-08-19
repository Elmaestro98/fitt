// Cadre des ecrans HORS session : activation d'un lien, et ecran d'acces.
//
// Pas de barre laterale, pas de barre haute, et c'est voulu : a ce stade,
// personne n'est identifie. Afficher un menu "Mes seances" a quelqu'un dont
// on ne connait meme pas le nom serait une promesse en l'air.
//
// Une seule colonne centree, pensee pour un ecran de 360 px (§11).
import { Logo } from "@/components/ui/logo";

export function CadreSimple({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex justify-center px-4 py-6">
        <Logo hauteur={30} prioritaire />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12">
        {children}
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted">
        Fitt — gestion de salle de sport
      </footer>
    </div>
  );
}
