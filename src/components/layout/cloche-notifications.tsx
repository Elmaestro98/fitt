"use client";

// Centre d'alertes de la barre haute.
//
// Composant client uniquement pour l'ouverture du panneau : les donnees lui
// sont passees en props par le layout, qui les tient de la couche data (§3).
// Rien n'est calcule dans le navigateur.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import type { Notification } from "@/lib/data/notifications";
import { cn } from "@/lib/utils/cn";

export function ClocheNotifications({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;

    function surClic(evenement: MouseEvent) {
      if (!conteneur.current?.contains(evenement.target as Node)) {
        setOuvert(false);
      }
    }
    function surEchap(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", surClic);
    document.addEventListener("keydown", surEchap);
    return () => {
      document.removeEventListener("mousedown", surClic);
      document.removeEventListener("keydown", surEchap);
    };
  }, [ouvert]);

  const alertes = notifications.filter((n) => n.ton === "alerte").length;

  return (
    <div ref={conteneur} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-label={
          notifications.length === 0
            ? "Notifications — rien a signaler"
            : `Notifications — ${notifications.length} a voir`
        }
        aria-expanded={ouvert}
        className="relative rounded-control p-2 text-muted hover:bg-sunken hover:text-ink"
      >
        <Bell className="size-5" />
        {notifications.length > 0 && (
          <span
            className={cn(
              "absolute top-1 right-1 flex size-4 items-center justify-center",
              "rounded-full text-[10px] font-semibold text-white",
              // Orange s'il y a une vraie alerte, gris si ce n'est
              // qu'informatif : la pastille doit vouloir dire quelque chose.
              alertes > 0 ? "bg-brand" : "bg-muted",
            )}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute top-full right-0 z-40 mt-2 w-72 overflow-hidden rounded-card border border-line bg-surface shadow-lg">
          <p className="border-b border-line px-4 py-2.5 text-sm font-medium text-ink">
            A votre attention
          </p>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-success-soft">
                <Check className="size-4 text-success" />
              </span>
              <p className="text-sm text-muted">
                Rien a signaler. Tout est a jour.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {notifications.map((notification) => (
                <li key={notification.cle}>
                  <Link
                    href={notification.href}
                    onClick={() => setOuvert(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-sunken"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        notification.ton === "alerte"
                          ? "bg-brand"
                          : "bg-muted/50",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-ink">
                      {notification.libelle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
