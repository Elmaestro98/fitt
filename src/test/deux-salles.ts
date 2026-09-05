// =============================================================================
// Le decor des tests d'isolation : DEUX salles completes, voisines et
// etrangeres l'une a l'autre.
//
// Tout le principe tient la-dedans. On remplit les deux salles avec les memes
// entites — adherent, formule, abonnement, paiement, pointage, produit,
// commande, coach, cours, reservation — puis on se connecte a l'une et on
// verifie que RIEN de l'autre ne remonte. Une fonction qui aurait oublie son
// filtre gymId renverrait deux lignes la ou on en attend une : le test tombe.
//
// /!\ Ces tests ecrivent dans la VRAIE base, faute d'une base de test separee.
// Deux precautions, et elles ne sont pas negociables :
//   - tout ce qui est cree porte un identifiant tire au hasard a chaque
//     execution, donc rien ne peut entrer en collision avec des donnees
//     reelles ni avec une execution precedente ;
//   - le nettoyage ne supprime QUE des lignes dont le gymId est l'un des deux
//     que le test vient de creer. Aucune requete de ce fichier ne peut
//     atteindre une ligne qu'il n'a pas ecrite.
// =============================================================================
import { prisma } from "@/lib/prisma";

/** Suffixe unique a cette execution : deux lancements simultanes ne se
 *  gene(nt) pas, et un plantage laisse des traces identifiables. */
const MARQUE = `test${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export type SalleFictive = {
  gymId: string;
  clerkOrgId: string;
  adherentId: string;
  formuleId: string;
  abonnementId: string;
  paiementId: string;
  pointageId: string;
  produitId: string;
  commandeId: string;
  coachId: string;
  typeCoursId: string;
  sessionCoursId: string;
  reservationId: string;
  /** Le nom de l'adherent, unique a cette salle : c'est lui qu'on cherche
   *  pour verifier qu'une recherche ne traverse pas les murs. */
  nomAdherent: string;
};

const JOUR = 86_400_000;

/**
 * Cree une salle et la remplit. Le suffixe distingue les deux salles entre
 * elles ("a" et "b").
 */
async function creerSalle(suffixe: string): Promise<SalleFictive> {
  const marque = `${MARQUE}${suffixe}`;

  const gym = await prisma.gym.create({
    data: {
      clerkOrgId: `org_${marque}`,
      nom: `Salle ${marque}`,
      // Actif et non soumise a un essai : etatAccesSalle doit repondre
      // "ouvert", sinon getTenantContext refuserait la session et les tests
      // echoueraient pour une raison qui n'a rien a voir avec l'isolation.
      actif: true,
      activeeLe: new Date(),
      abonnee: true,
    },
  });

  const gymId = gym.id;

  const adherent = await prisma.adherent.create({
    data: {
      gymId,
      numero: `FITT-${suffixe.toUpperCase()}001`,
      prenom: "Adherent",
      nom: `De${marque}`,
      // Numero unique par (gymId, telephone) : il peut donc etre identique
      // d'une salle a l'autre. On le fait varier quand meme, pour que la
      // recherche par telephone distingue les deux.
      telephone: `+221${(700000000 + Math.floor(Math.random() * 99999999)).toString().slice(0, 9)}`,
    },
  });

  const formule = await prisma.formule.create({
    data: {
      gymId,
      nom: `Formule ${marque}`,
      prix: 15000,
      dureeValeur: 1,
      dureeUnite: "MOIS",
    },
  });

  const abonnement = await prisma.abonnement.create({
    data: {
      gymId,
      adherentId: adherent.id,
      formuleId: formule.id,
      nomFormule: formule.nom,
      prixPaye: 15000,
      debutLe: new Date(Date.now() - 5 * JOUR),
      finLe: new Date(Date.now() + 25 * JOUR),
      statut: "ACTIF",
    },
  });

  const paiement = await prisma.paiement.create({
    data: {
      gymId,
      adherentId: adherent.id,
      abonnementId: abonnement.id,
      montant: 15000,
      methode: "ESPECES",
      reference: `REF-${marque}`,
    },
  });

  const pointage = await prisma.pointage.create({
    data: {
      gymId,
      adherentId: adherent.id,
      horodatage: new Date(),
      source: "KIOSQUE",
      statutAdherent: "ACTIF",
      cleLocale: `cle-${marque}`,
    },
  });

  const produit = await prisma.produit.create({
    data: { gymId, nom: `Produit ${marque}`, prix: 2000 },
  });

  const commande = await prisma.commande.create({
    data: { gymId, adherentId: adherent.id, statut: "EN_ATTENTE" },
  });

  await prisma.ligneCommande.create({
    data: {
      gymId,
      commandeId: commande.id,
      produitId: produit.id,
      nomProduit: produit.nom,
      prixUnitaire: 2000,
      quantite: 1,
    },
  });

  const coach = await prisma.coach.create({
    data: { gymId, prenom: "Coach", nom: `De${marque}` },
  });

  const typeCours = await prisma.typeCours.create({
    data: { gymId, nom: `Cours ${marque}` },
  });

  const sessionCours = await prisma.sessionCours.create({
    data: {
      gymId,
      typeCoursId: typeCours.id,
      coachId: coach.id,
      debutLe: new Date(Date.now() + JOUR),
      dureeMinutes: 60,
      capacite: 15,
      placesReservees: 1,
    },
  });

  const reservation = await prisma.reservation.create({
    data: {
      gymId,
      sessionCoursId: sessionCours.id,
      adherentId: adherent.id,
      statut: "CONFIRMEE",
    },
  });

  return {
    gymId,
    clerkOrgId: gym.clerkOrgId,
    adherentId: adherent.id,
    formuleId: formule.id,
    abonnementId: abonnement.id,
    paiementId: paiement.id,
    pointageId: pointage.id,
    produitId: produit.id,
    commandeId: commande.id,
    coachId: coach.id,
    typeCoursId: typeCours.id,
    sessionCoursId: sessionCours.id,
    reservationId: reservation.id,
    nomAdherent: adherent.nom,
  };
}

export async function creerDeuxSalles(): Promise<[SalleFictive, SalleFictive]> {
  // En serie et non en parallele : deux `create` simultanes sur la meme table
  // depuis un pooler en mode transaction donnent des echecs intermittents qui
  // n'apprennent rien.
  const a = await creerSalle("a");
  const b = await creerSalle("b");
  return [a, b];
}

/**
 * Efface tout ce que le decor a cree.
 *
 * /!\ L'ordre est impose par les relations : le schema declare
 * `onDelete: Restrict` partout, precisement pour qu'aucune suppression ne
 * puisse en entrainer d'autres en silence (§9). Les enfants partent donc
 * avant les parents, et une erreur ici signale une relation oubliee — pas un
 * detail de test.
 *
 * Chaque `deleteMany` porte sur `gymId: { in: ... }` : il est impossible que
 * ce nettoyage touche une ligne appartenant a une vraie salle.
 */
export async function effacerSalles(salles: SalleFictive[]): Promise<void> {
  const gymIds = salles.map((s) => s.gymId);
  if (gymIds.length === 0) return;

  const ou = { gymId: { in: gymIds } };

  await prisma.paiement.deleteMany({ where: ou });
  await prisma.ligneCommande.deleteMany({ where: ou });
  await prisma.commande.deleteMany({ where: ou });
  await prisma.produit.deleteMany({ where: ou });
  await prisma.reservation.deleteMany({ where: ou });
  await prisma.sessionCours.deleteMany({ where: ou });
  await prisma.typeCours.deleteMany({ where: ou });
  await prisma.coach.deleteMany({ where: ou });
  await prisma.pointage.deleteMany({ where: ou });
  await prisma.abonnement.deleteMany({ where: ou });
  await prisma.formule.deleteMany({ where: ou });
  await prisma.sessionAdherent.deleteMany({ where: ou });
  await prisma.invitation.deleteMany({ where: ou });
  await prisma.adherent.deleteMany({ where: ou });
  await prisma.lienInscription.deleteMany({ where: ou });
  await prisma.gym.deleteMany({ where: { id: { in: gymIds } } });
}
