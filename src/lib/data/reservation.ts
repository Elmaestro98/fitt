// Acces aux donnees des reservations de seances de cours.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function listerReservationsSession(sessionCoursId: string) {
  const { gymId } = await getTenantContext();

  return prisma.reservation.findMany({
    where: { sessionCoursId, gymId, statut: "CONFIRMEE" },
    orderBy: { creeLe: "asc" },
    include: {
      adherent: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          numero: true,
          photoUrl: true,
          telephone: true,
        },
      },
    },
  });
}

export const schemaReservation = z.object({
  adherentId: z.string().min(1, "Choisissez un adherent"),
});

/**
 * Inscrit un adherent sur une seance.
 *
 * /!\ VERROU OPTIMISTE (CLAUDE.md §6) : le where de l'increment compare
 * placesReservees a la valeur LUE au debut de la transaction. Si une autre
 * inscription concurrente (deux receptionnistes, la derniere place) a deja
 * incremente ce compteur entre notre lecture et cet appel, count vaut 0 et on
 * echoue proprement plutot que d'accepter deux inscriptions sur une seance
 * complete. Meme principe que inscrireViaLien dans invitation.ts — une simple
 * transaction Prisma ne suffit pas a proteger un compteur sous l'isolation par
 * defaut de Postgres (READ COMMITTED).
 *
 * Le couple (sessionCoursId, adherentId) est UNIQUE en base (voir le schema) :
 * un adherent qui s'etait desinscrit garde sa ligne, desormais ANNULEE. On la
 * fait revivre plutot que d'en creer une seconde, sinon la reinscription
 * echouerait sur la contrainte d'unicite.
 */
export async function reserverPlace(
  sessionCoursId: string,
  donnees: z.infer<typeof schemaReservation>,
) {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    const session = await tx.sessionCours.findFirst({
      where: { id: sessionCoursId, gymId },
      select: { id: true, capacite: true, placesReservees: true, statut: true },
    });
    if (!session) throw new Error("Seance introuvable");
    if (session.statut !== "PLANIFIEE") {
      throw new Error("Cette seance n'est plus ouverte aux inscriptions");
    }

    // On ne fait aucune confiance a l'id recu (§3) : l'adherent doit
    // appartenir a CETTE salle.
    const adherent = await tx.adherent.findFirst({
      where: { id: donnees.adherentId, gymId },
      select: { id: true },
    });
    if (!adherent) throw new Error("Adherent introuvable");

    const existante = await tx.reservation.findUnique({
      where: {
        sessionCoursId_adherentId: {
          sessionCoursId,
          adherentId: donnees.adherentId,
        },
      },
    });
    if (existante?.statut === "CONFIRMEE") {
      throw new Error("Cet adherent est deja inscrit a cette seance");
    }

    if (session.placesReservees >= session.capacite) {
      throw new Error("Seance complete");
    }

    const maj = await tx.sessionCours.updateMany({
      where: { id: sessionCoursId, gymId, placesReservees: session.placesReservees },
      data: { placesReservees: { increment: 1 } },
    });
    if (maj.count === 0) {
      throw new Error("Une autre inscription vient d'avoir lieu. Reessayez.");
    }

    if (existante) {
      return tx.reservation.update({
        where: { id: existante.id },
        data: { statut: "CONFIRMEE", annuleLe: null, motifAnnul: null },
      });
    }

    return tx.reservation.create({
      data: {
        gymId,
        sessionCoursId,
        adherentId: donnees.adherentId,
        statut: "CONFIRMEE",
      },
    });
  });
}

/**
 * Desinscrit un adherent. Libere la place sur la seance.
 *
 * Aucun verrou optimiste necessaire ici : decrementer ne menace aucun
 * invariant (contrairement a l'increment, qui doit rester sous la capacite).
 */
export async function annulerReservation(id: string) {
  const { gymId } = await getTenantContext();

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findFirst({
      where: { id, gymId, statut: "CONFIRMEE" },
    });
    if (!reservation) throw new Error("Reservation introuvable ou deja annulee");

    await tx.reservation.update({
      where: { id },
      data: { statut: "ANNULEE", annuleLe: new Date() },
    });

    await tx.sessionCours.update({
      where: { id: reservation.sessionCoursId },
      data: { placesReservees: { decrement: 1 } },
    });

    return reservation;
  });
}
