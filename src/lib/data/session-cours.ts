// Acces aux donnees du planning des seances de cours.
import "server-only";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function listerSessionsCours({ inclureAnnulees = false } = {}) {
  const { gymId } = await getTenantContext();

  return prisma.sessionCours.findMany({
    where: {
      gymId,
      ...(inclureAnnulees ? {} : { statut: { not: "ANNULEE" } }),
    },
    // Le planning se lit dans l'ordre chronologique, les prochaines seances
    // en premier.
    orderBy: { debutLe: "asc" },
    include: {
      typeCours: { select: { nom: true, couleur: true } },
      coach: { select: { prenom: true, nom: true } },
    },
  });
}

export async function trouverSessionCours(id: string) {
  const { gymId } = await getTenantContext();
  // findFirst, jamais findUnique : lui seul accepte le filtre gymId.
  return prisma.sessionCours.findFirst({
    where: { id, gymId },
    include: {
      typeCours: { select: { nom: true, couleur: true } },
      coach: { select: { prenom: true, nom: true } },
    },
  });
}

export const schemaSessionCours = z.object({
  typeCoursId: z.string().min(1, "Choisissez un type de cours"),
  coachId: z.string().min(1, "Choisissez un coach"),
  // Un <input type="datetime-local"> renvoie "2026-08-25T18:00", sans fuseau.
  // Dakar est a UTC+0 toute l'annee (voir lib/utils/duree.ts) : on peut donc
  // completer en UTC explicitement, sans dependre du fuseau de la machine qui
  // execute le code.
  debutLe: z
    .string()
    .min(1, "La date et l'heure sont requises")
    .transform((v) => new Date(`${v}:00Z`))
    .refine((d) => !Number.isNaN(d.getTime()), "Date invalide"),
  dureeMinutes: z.coerce
    .number()
    .int()
    .min(10, "La duree doit valoir au moins 10 minutes")
    .max(480, "Duree trop longue"),
  capacite: z.coerce
    .number()
    .int()
    .min(1, "La capacite doit valoir au moins 1")
    .max(200, "Capacite trop grande"),
});

export type DonneesSessionCours = z.infer<typeof schemaSessionCours>;

export const schemaAnnulationSession = z.object({
  motif: z
    .string()
    .trim()
    .min(5, "Indiquez un motif d'au moins 5 caracteres"),
});

/**
 * Annule une seance. Jamais de suppression (§9) : la seance reste visible
 * dans son historique, marquee ANNULEE avec un motif.
 *
 * Les reservations deja confirmees ne sont PAS touchees : elles restent la
 * trace de qui s'etait inscrit au moment de l'annulation, utile au staff pour
 * prevenir ces adherents. reserverPlace refuse deja toute nouvelle inscription
 * sur une seance qui n'est plus PLANIFIEE.
 */
export async function annulerSessionCours(id: string, motif: string) {
  const { gymId } = await getTenantContext();

  const resultat = await prisma.sessionCours.updateMany({
    where: { id, gymId, statut: "PLANIFIEE" },
    data: { statut: "ANNULEE", annuleLe: new Date(), motifAnnul: motif },
  });

  if (resultat.count === 0) {
    throw new Error("Seance introuvable ou deja annulee");
  }
}

export async function creerSessionCours(donnees: DonneesSessionCours) {
  const { gymId } = await getTenantContext();

  // On ne fait aucune confiance aux id recus, meme s'ils viennent de notre
  // propre formulaire (§3) : le type de cours et le coach doivent appartenir
  // a CETTE salle, et etre actifs — on ne programme pas de seance sur un
  // catalogue ou un coach archive.
  const [typeCours, coach] = await Promise.all([
    prisma.typeCours.findFirst({
      where: { id: donnees.typeCoursId, gymId, actif: true },
      select: { id: true },
    }),
    prisma.coach.findFirst({
      where: { id: donnees.coachId, gymId, actif: true },
      select: { id: true },
    }),
  ]);
  if (!typeCours) throw new Error("Type de cours introuvable ou archive");
  if (!coach) throw new Error("Coach introuvable ou archive");

  return prisma.sessionCours.create({
    data: {
      gymId,
      typeCoursId: donnees.typeCoursId,
      coachId: donnees.coachId,
      debutLe: donnees.debutLe,
      dureeMinutes: donnees.dureeMinutes,
      capacite: donnees.capacite,
    },
  });
}

/**
 * Modifie une seance PLANIFIEE : type de cours, coach, date/heure, duree,
 * capacite.
 *
 * On ne peut pas descendre la capacite sous le nombre de places deja
 * reservees (§9, meme esprit que le reste du projet : une modification ne
 * doit jamais mettre une donnee existante en contradiction avec elle-meme —
 * ici, plus d'inscrits que de places).
 */
export async function modifierSessionCours(
  id: string,
  donnees: DonneesSessionCours,
) {
  const { gymId } = await getTenantContext();

  const [session, typeCours, coach] = await Promise.all([
    prisma.sessionCours.findFirst({
      where: { id, gymId },
      select: { statut: true, placesReservees: true },
    }),
    prisma.typeCours.findFirst({
      where: { id: donnees.typeCoursId, gymId, actif: true },
      select: { id: true },
    }),
    prisma.coach.findFirst({
      where: { id: donnees.coachId, gymId, actif: true },
      select: { id: true },
    }),
  ]);

  if (!session) throw new Error("Seance introuvable");
  if (session.statut !== "PLANIFIEE") {
    throw new Error("Cette seance n'est plus modifiable");
  }
  if (!typeCours) throw new Error("Type de cours introuvable ou archive");
  if (!coach) throw new Error("Coach introuvable ou archive");
  if (donnees.capacite < session.placesReservees) {
    throw new Error(
      `La capacite ne peut pas etre inferieure aux ${session.placesReservees} places deja reservees`,
    );
  }

  const resultat = await prisma.sessionCours.updateMany({
    where: { id, gymId, statut: "PLANIFIEE" },
    data: {
      typeCoursId: donnees.typeCoursId,
      coachId: donnees.coachId,
      debutLe: donnees.debutLe,
      dureeMinutes: donnees.dureeMinutes,
      capacite: donnees.capacite,
    },
  });

  if (resultat.count === 0) throw new Error("Seance introuvable");
}
