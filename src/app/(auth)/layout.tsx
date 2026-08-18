// Habillage commun a toutes les pages d'authentification du staff.
// Fond sombre #2D3133 du design system (CLAUDE.md §11).
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sidebar px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo hauteur={48} prioritaire />
        <p className="mt-4 text-sm text-sidebar-text">
          Espace de gestion — reserve a l&apos;equipe de la salle
        </p>
      </div>
      {children}
    </div>
  );
}
