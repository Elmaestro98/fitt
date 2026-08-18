"use client";

import { Bell, Menu, Search } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export function Topbar({ onOuvrirMenu }: { onOuvrirMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {/* Ouverture du tiroir : visible uniquement sous lg. */}
        <button
          type="button"
          onClick={onOuvrirMenu}
          className="rounded-control p-2 text-muted hover:bg-sunken hover:text-ink lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Recherche. Non fonctionnelle tant que la table Adherent n'existe
            pas : desactivee plutot que de simuler un resultat. */}
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            disabled
            placeholder="Rechercher un adherent, un abonnement..."
            className="h-10 w-full rounded-pill border border-transparent bg-sunken pr-4 pl-9 text-sm text-ink placeholder:text-muted focus:border-line focus:outline-none disabled:cursor-not-allowed"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            disabled
            className="rounded-control p-2 text-muted disabled:cursor-not-allowed"
            aria-label="Notifications (Lot 2)"
          >
            <Bell className="size-5" />
          </button>

          {/* Selecteur de salle : c'est lui qui change l'orgId de la session,
              donc le gymId resolu par getTenantContext(). */}
          <div className="hidden sm:block">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/salle/initialisation"
              afterSelectOrganizationUrl="/salle/initialisation"
            />
          </div>

          <UserButton />
        </div>
      </div>
    </header>
  );
}
