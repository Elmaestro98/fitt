// Ce qui reclame l'attention du staff, en un seul appel.
//
// /!\ Ce n'est PAS le chantier "notifications WhatsApp automatiques", mis en
// pause le 19/08/2026 (§12). WhatsApp est un canal d'ENVOI ; ceci est un
// centre d'alertes interne a l'application. Aucune verification Meta, aucun
// template a faire approuver, aucun cout par message — uniquement des donnees
// deja en base, relues a l'affichage.
//
// Chaque entree repond a la meme question : "y a-t-il quelque chose que
// personne n'a vu et qui coute de l'argent ou bloque quelqu'un ?"
import "server-only";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

/** Fenetre d'alerte sur les echeances. Sept jours : assez tot pour relancer,
 *  assez proche pour que ce soit encore une urgence. Le tableau de bord, lui,
 *  regarde a 30 jours — c'est une vue de pilotage, pas une alerte. */
const JOURS_ECHEANCE = 7;
const JOUR_MS = 24 * 60 * 60 * 1000;

export type Notification = {
  cle: string;
  libelle: string;
  nombre: number;
  href: string;
  /** "alerte" attire l'oeil, "info" se contente d'informer. */
  ton: "alerte" | "info";
};

export async function notificationsStaff(): Promise<{
  notifications: Notification[];
  total: number;
}> {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();
  const limite = new Date(maintenant.getTime() + JOURS_ECHEANCE * JOUR_MS);

  const [expirations, enAttente, commandes] = await Promise.all([
    // Abonnements qui s'achevent dans la semaine : la relance se joue
    // maintenant, pas le jour de l'expiration.
    prisma.abonnement.count({
      where: { gymId, statut: "ACTIF", finLe: { gte: maintenant, lte: limite } },
    }),
    // Fiches nees d'un lien d'inscription, en attente de validation (§4).
    // Sans cette alerte, une pre-inscription peut rester bloquee des jours
    // sans que personne ne s'en apercoive.
    prisma.adherent.count({
      where: { gymId, statut: "EN_ATTENTE_VALIDATION" },
    }),
    prisma.commande.count({
      where: { gymId, statut: { in: ["EN_ATTENTE", "PRETE"] } },
    }),
  ]);

  const notifications: Notification[] = [];

  if (enAttente > 0) {
    notifications.push({
      cle: "validation",
      libelle:
        enAttente > 1
          ? `${enAttente} inscriptions attendent votre validation`
          : "1 inscription attend votre validation",
      nombre: enAttente,
      href: "/adherents?statut=EN_ATTENTE_VALIDATION",
      ton: "alerte",
    });
  }

  if (expirations > 0) {
    notifications.push({
      cle: "expirations",
      libelle:
        expirations > 1
          ? `${expirations} abonnements expirent sous ${JOURS_ECHEANCE} jours`
          : `1 abonnement expire sous ${JOURS_ECHEANCE} jours`,
      nombre: expirations,
      href: "/abonnements",
      ton: "alerte",
    });
  }

  if (commandes > 0) {
    notifications.push({
      cle: "commandes",
      libelle:
        commandes > 1
          ? `${commandes} commandes a preparer`
          : "1 commande a preparer",
      nombre: commandes,
      href: "/commandes",
      ton: "info",
    });
  }

  return {
    notifications,
    // Le nombre d'ALERTES, pas la somme des elements : "3" sur la pastille
    // veut dire "trois choses a regarder", pas "trois cent adherents".
    total: notifications.length,
  };
}
