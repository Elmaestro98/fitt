import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en resolvant les conflits.
 *
 *   cn("px-4 py-2", "px-6")        -> "py-2 px-6"   (px-6 gagne, pas px-4)
 *   cn("text-ink", condition && "text-danger")
 *
 * Sans twMerge, "px-4 px-6" laisserait l'ordre du CSS decider, pas l'appelant.
 */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
