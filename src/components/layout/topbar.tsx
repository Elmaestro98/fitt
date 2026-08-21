"use client";

import { Menu } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { RechercheGlobale } from "@/components/layout/recherche-globale";
import { ClocheNotifications } from "@/components/layout/cloche-notifications";
import type { Notification } from "@/lib/data/notifications";

export function Topbar({
  onOuvrirMenu,
  notifications,
}: {
  onOuvrirMenu: () => void;
  notifications: Notification[];
}) {
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

        <RechercheGlobale />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ClocheNotifications notifications={notifications} />

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
