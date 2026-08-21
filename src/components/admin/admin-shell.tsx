"use client";

// Habillage client de /admin : porte l'etat du theme (sombre par defaut,
// voir globals.css) et l'en-tete. Extrait de layout.tsx pour que le bouton
// de bascule puisse avoir un etat local — un Server Component ne le peut
// pas. La verification d'acces (getSuperAdminContext) reste, elle, dans
// layout.tsx : c'est un appel serveur, il n'a rien a faire ici.
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import { ThemeToggleAdmin } from "@/components/admin/theme-toggle";
import { AdminPortalContext } from "@/components/admin/admin-theme-context";

const CLE_THEME = "fitt-admin-theme";

export function AdminShell({ children }: { children: React.ReactNode }) {
  // Sombre au premier rendu (identique au rendu serveur, donc pas de
  // decalage d'hydratation) ; le choix enregistre n'est applique qu'apres
  // le montage, cf. le pattern deja documente pour les stores clients
  // (CLAUDE.md §6).
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [conteneur, setConteneur] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const enregistre = localStorage.getItem(CLE_THEME);
    if (enregistre === "light") setTheme("light");
  }, []);

  function basculer(clair: boolean) {
    const suivant = clair ? "light" : "dark";
    setTheme(suivant);
    localStorage.setItem(CLE_THEME, suivant);
  }

  return (
    <div
      ref={setConteneur}
      data-admin-theme={theme}
      className="min-h-screen bg-admin-bg text-admin-text"
      style={{ colorScheme: theme }}
    >
      {/* Fin liseré de marque en tete d'ecran : le seul emprunt direct a
          l'orange du produit, comme un temoin "sous tension". */}
      <div className="h-[2px] bg-admin-accent" />

      <header className="border-b border-admin-line px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 text-admin-accent" />
            <p className="text-sm">
              <span className="font-semibold tracking-tight">Fitt</span>
              <span className="text-admin-muted"> · Administration</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggleAdmin theme={theme} onChange={basculer} />
            <UserButton />
          </div>
        </div>
      </header>

      <AdminPortalContext.Provider value={conteneur}>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </AdminPortalContext.Provider>
    </div>
  );
}
