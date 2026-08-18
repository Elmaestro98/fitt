// Habillage des pages publiques : celles qu'un adherent ouvre depuis son
// telephone, sans compte et sans connexion.
//
// Pas de barre laterale, pas de menu : cette personne n'est pas dans le
// back-office et n'a rien a y faire. Fond clair, une seule colonne, pensee
// pour un ecran de 360 px (CLAUDE.md §11).
import { Logo } from "@/components/ui/logo";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex justify-center px-4 py-6">
        <Logo hauteur={32} prioritaire />
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
