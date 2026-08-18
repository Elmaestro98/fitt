// Habillage commun a toutes les pages d'authentification du staff.
// Fond navy #0F172A du design system (CLAUDE.md §11).
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Fi<span className="text-[#FF6B35]">tt</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Espace de gestion — reserve a l&apos;equipe de la salle
        </p>
      </div>
      {children}
    </div>
  );
}
