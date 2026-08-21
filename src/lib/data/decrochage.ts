// =============================================================================
// Detection des adherents qui decrochent.
//
// L'angle mort que ce fichier comble : Fitt surveille le CONTRAT (quand
// l'abonnement expire-t-il ?) mais pas le COMPORTEMENT (vient-il encore ?).
// Quelqu'un qui a paye un annuel en mars reste "ACTIF" jusqu'en mars suivant,
// meme s'il a cesse de venir en avril — et personne ne le voit avant le
// renouvellement, quand il est trop tard pour le retenir.
//
// Le croisement tient en une phrase : un abonnement ACTIF (il paie encore)
// + un dernier pointage lointain (il ne vient plus) = quelqu'un qui part.
//
// C'est le miroir de adherentsAssidus (data/rapport.ts), qui repond a la
// question inverse : qui vient le plus ?
// =============================================================================
import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Absence a partir de laquelle on considere qu'un adherent decroche.
 *
 * Trois semaines : dans une salle de sport, ce n'est plus un accident de
 * calendrier (voyage, maladie) mais une habitude perdue. Assez tot pour
 * rattraper, assez tard pour ne pas deranger les gens pour rien — une liste
 * pleine de faux positifs, le gerant cesse de la regarder.
 */
export const JOURS_DECROCHAGE = 21;

export type AdherentQuiDecroche = {
  id: string;
  numero: string;
  prenom: string;
  nom: string;
  telephone: string;
  photoUrl: string | null;
  /** null quand la personne n'est jamais venue depuis sa souscription. */
  derniereVenue: Date | null;
  joursAbsence: number;
};

/**
 * Les adherents a abonnement ACTIF qui ne viennent plus.
 *
 * /!\ Volontairement limite aux abonnements actifs. Un adherent expire ne
 * vient plus lui non plus, mais c'est normal — il releve de la relance
 * impayes (bouton WhatsApp du Lot 2), pas d'ici. Ce qui rend cette liste
 * precieuse, c'est justement que ce sont des gens qui PAIENT SANS VENIR.
 *
 * Le delai de grace des nouveaux inscrits n'a pas besoin d'etre code : la
 * date de reference d'une personne jamais venue est le debut de son
 * abonnement. Quelqu'un inscrit il y a cinq jours affiche donc cinq jours
 * d'absence, bien en dessous du seuil, et n'apparait pas.
 */
export const adherentsQuiDecrochent = cache(async function adherentsQuiDecrochent(
  jours: number = JOURS_DECROCHAGE,
): Promise<AdherentQuiDecroche[]> {
  const { gymId } = await getTenantContext();

  const maintenant = new Date();

  // 1. Qui paie encore ? On garde debutLe : c'est la date de reference de
  //    ceux qui ne sont jamais venus.
  const abonnements = await prisma.abonnement.findMany({
    where: {
      gymId,
      statut: "ACTIF",
      finLe: { gte: maintenant },
      // Un adherent archive ou suspendu n'a pas a etre relance.
      adherent: { statut: "ACTIF" },
    },
    select: {
      debutLe: true,
      adherent: {
        select: {
          id: true,
          numero: true,
          prenom: true,
          nom: true,
          telephone: true,
          photoUrl: true,
        },
      },
    },
  });

  if (abonnements.length === 0) return [];

  // Un adherent peut avoir plusieurs abonnements actifs (renouvellement
  // anticipe) : on ne garde que le plus ancien debut, celui qui reflete
  // depuis quand il est cense frequenter la salle.
  const parAdherent = new Map<
    string,
    { adherent: (typeof abonnements)[number]["adherent"]; debutLe: Date }
  >();

  for (const { adherent, debutLe } of abonnements) {
    const connu = parAdherent.get(adherent.id);
    if (!connu || debutLe < connu.debutLe) {
      parAdherent.set(adherent.id, { adherent, debutLe });
    }
  }

  const ids = [...parAdherent.keys()];

  // 2. Leur dernier passage. L'index (gymId, adherentId, horodatage) existe
  //    deja (§10) : ce groupBy n'ajoute aucune migration.
  const derniersPassages = await prisma.pointage.groupBy({
    by: ["adherentId"],
    where: { gymId, adherentId: { in: ids } },
    _max: { horodatage: true },
  });

  const derniereVenueParId = new Map(
    derniersPassages.map((p) => [p.adherentId, p._max.horodatage]),
  );

  // 3. Le croisement.
  const lignes: AdherentQuiDecroche[] = [];

  for (const { adherent, debutLe } of parAdherent.values()) {
    const derniereVenue = derniereVenueParId.get(adherent.id) ?? null;
    // Jamais venu : on compte depuis le debut de son abonnement. C'est le cas
    // le plus grave — il n'a meme pas commence — et un calcul qui chercherait
    // une date de passage inexistante le raterait entierement.
    const reference = derniereVenue ?? debutLe;

    const joursAbsence = Math.floor(
      (maintenant.getTime() - reference.getTime()) / JOUR_MS,
    );

    if (joursAbsence >= jours) {
      lignes.push({ ...adherent, derniereVenue, joursAbsence });
    }
  }

  // Le plus absent en premier : c'est celui qu'il faut appeler aujourd'hui.
  lignes.sort((a, b) => b.joursAbsence - a.joursAbsence);

  return lignes;
});

/**
 * Compteur seul, pour la cloche de notifications.
 *
 * Reutilise la fonction ci-dessus plutot que de refaire un calcul approchant :
 * un compteur qui divergerait de la liste (12 dans la cloche, 9 dans le
 * tableau) ruinerait la confiance dans les deux. Grace au cache() de React,
 * la double lecture d'un meme rendu ne coute qu'une seule requete — le
 * tableau de bord affiche la liste ET la cloche compte, dans la meme page.
 */
export async function compterAdherentsQuiDecrochent(
  jours = JOURS_DECROCHAGE,
): Promise<number> {
  const lignes = await adherentsQuiDecrochent(jours);
  return lignes.length;
}
