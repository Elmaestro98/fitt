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
        className={cn(
          "group relative rounded-control p-2 text-muted transition-colors",
          "duration-[var(--duree-instant)] ease-sortie hover:bg-sunken hover:text-ink",
        )}
      >
        {/* La cloche s'incline au survol, comme si on la faisait sonner.
            Detail gratuit, mais c'est de ces details qu'une interface tire
            son caractere. */}
        <Bell
          className={cn(
            "size-5 origin-top transition-transform",
            "duration-[var(--duree-courte)] ease-ressort group-hover:-rotate-12",
          )}
        />
        {notifications.length > 0 && (
          <>
            {/* Halo qui pulse DERRIERE la pastille, et seulement quand il y a
                une vraie alerte. Une pastille purement informative ne doit pas
                clignoter : on cesserait vite de la regarder. */}
            {alertes > 0 && (
              <span
                aria-hidden="true"
                className="animate-pouls-doux absolute top-1 right-1 size-4 rounded-full bg-brand/40"
              />
            )}
            <span
              className={cn(
                "animate-surgir absolute top-1 right-1 flex size-4 items-center justify-center",
                "rounded-full text-[10px] font-semibold text-white tabular-nums",
                // Orange s'il y a une vraie alerte, gris si ce n'est
                // qu'informatif : la pastille doit vouloir dire quelque chose.
                alertes > 0 ? "bg-brand" : "bg-muted",
              )}
            >
              {notifications.length}
            </span>
          </>
        )}
      </button>

      {ouvert && (
        <div
          className={cn(
            "absolute top-full right-0 z-40 mt-2 w-72 overflow-hidden",
            "rounded-card border border-line bg-surface shadow-flottant",
            // Le panneau surgit depuis son coin haut-droit, c'est-a-dire
            // depuis la cloche : le mouvement dit d'ou il vient.
            "animate-surgir origin-top-right",
          )}
        >
          <p className="display border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">
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
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      "duration-[var(--duree-instant)] hover:bg-sunken",
                    )}
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
