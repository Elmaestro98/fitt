// Habillage commun a toutes les pages d'authentification du staff.
// Fond sombre #2D3133 du design system (CLAUDE.md §11), meme decor que la
// page d'accueil : on arrive ici depuis elle, la continuite visuelle evite
// l'impression d'avoir change de site.
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sidebar px-4 py-12">
      {/* Decor : grille pale + halo orange. aria-hidden et pointer-events-none,
          car rien de tout cela n'est du contenu. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="animate-halo absolute top-1/4 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      </div>

      <div className="cascade relative flex w-full flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo hauteur={48} prioritaire />
          <p className="mt-4 text-sm text-sidebar-text">
            Espace de gestion — reserve a l&apos;equipe de la salle
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
