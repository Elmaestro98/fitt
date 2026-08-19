// Donnees de demonstration. A lancer avec : npx prisma db seed
//
// /!\ SEULE exception a la regle "tout passe par getTenantContext()" :
// un script en ligne de commande n'a pas de session Clerk. Le gymId est donc
// resolu explicitement ici, une fois, et transmis. Ce fichier ne doit jamais
// etre importe par l'application.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Modele = {
  prenom: string;
  nom: string;
  telephone: string;
  sexe: "HOMME" | "FEMME";
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU" | "ARCHIVE";
  ilYaJours: number;
};

const ADHERENTS: Modele[] = [
  {
    prenom: "Moussa",
    nom: "Diop",
    telephone: "+221771234567",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 2,
  },
  {
    prenom: "Awa",
    nom: "Ndiaye",
    telephone: "+221772345678",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 5,
  },
  {
    prenom: "Ousmane",
    nom: "Fall",
    telephone: "+221773456789",
    sexe: "HOMME",
    statut: "EXPIRE",
    ilYaJours: 9,
  },
  {
    prenom: "Fatou",
    nom: "Sow",
    telephone: "+221774567890",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 14,
  },
  {
    prenom: "Ibrahima",
    nom: "Sy",
    telephone: "+221775678901",
    sexe: "HOMME",
    statut: "SUSPENDU",
    ilYaJours: 21,
  },
  {
    prenom: "Seydou",
    nom: "Faye",
    telephone: "+221776789012",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 28,
  },
  {
    prenom: "Mariama",
    nom: "Ba",
    telephone: "+221777890123",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 33,
  },
  {
    prenom: "Cheikh",
    nom: "Gueye",
    telephone: "+221778901234",
    sexe: "HOMME",
    statut: "EXPIRE",
    ilYaJours: 40,
  },
  {
    prenom: "Aminata",
    nom: "Diallo",
    telephone: "+221779012345",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 47,
  },
  {
    prenom: "Modou",
    nom: "Kane",
    telephone: "+221770123456",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 55,
  },
  {
    prenom: "Khady",
    nom: "Seck",
    telephone: "+221771112233",
    sexe: "FEMME",
    statut: "ARCHIVE",
    ilYaJours: 62,
  },
  {
    prenom: "Alioune",
    nom: "Badara",
    telephone: "+221772223344",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 70,
  },
  {
    prenom: "Ndeye",
    nom: "Toure",
    telephone: "+221773334455",
    sexe: "FEMME",
    statut: "EXPIRE",
    ilYaJours: 78,
  },
  {
    prenom: "Babacar",
    nom: "Mbaye",
    telephone: "+221774445566",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 86,
  },
  {
    prenom: "Sokhna",
    nom: "Ndour",
    telephone: "+221775556677",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 95,
  },
  {
    prenom: "Lamine",
    nom: "Camara",
    telephone: "+221776667788",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 104,
  },
  {
    prenom: "Adama",
    nom: "Cisse",
    telephone: "+221777778899",
    sexe: "FEMME",
    statut: "SUSPENDU",
    ilYaJours: 112,
  },
  {
    prenom: "Pape",
    nom: "Sarr",
    telephone: "+221778889900",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 120,
  },
  {
    prenom: "Rokhaya",
    nom: "Diagne",
    telephone: "+221779990011",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 130,
  },
  {
    prenom: "Serigne",
    nom: "Thiam",
    telephone: "+221770001122",
    sexe: "HOMME",
    statut: "EXPIRE",
    ilYaJours: 141,
  },
  {
    prenom: "Bineta",
    nom: "Diouf",
    telephone: "+221771213141",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 150,
  },
  {
    prenom: "Malick",
    nom: "Ba",
    telephone: "+221772324252",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 160,
  },
  {
    prenom: "Coumba",
    nom: "Lo",
    telephone: "+221773435363",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 172,
  },
  {
    prenom: "Assane",
    nom: "Ndao",
    telephone: "+221774546474",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 185,
  },
  {
    prenom: "Yacine",
    nom: "Diaw",
    telephone: "+221775657585",
    sexe: "FEMME",
    statut: "ARCHIVE",
    ilYaJours: 200,
  },
  {
    prenom: "Samba",
    nom: "Wade",
    telephone: "+221776768696",
    sexe: "HOMME",
    statut: "ACTIF",
    ilYaJours: 215,
  },
  {
    prenom: "Dieynaba",
    nom: "Ka",
    telephone: "+221777879707",
    sexe: "FEMME",
    statut: "ACTIF",
    ilYaJours: 230,
  },
  {
    prenom: "Omar",
    nom: "Sagna",
    telephone: "+221778980818",
    sexe: "HOMME",
    statut: "EXPIRE",
    ilYaJours: 245,
  },
];

/* Tarifs indicatifs d'une salle independante au Senegal. */
const FORMULES = [
  {
    nom: "Seance",
    description: "Acces a la journee",
    prix: 2000,
    dureeValeur: 1,
    dureeUnite: "JOUR" as const,
    ordre: 0,
  },
  {
    nom: "Mensuel",
    description: "Acces libre a la salle",
    prix: 15000,
    dureeValeur: 1,
    dureeUnite: "MOIS" as const,
    ordre: 1,
  },
  {
    nom: "Trimestriel",
    description: "Acces libre + suivi mensuel",
    prix: 40000,
    dureeValeur: 3,
    dureeUnite: "MOIS" as const,
    ordre: 2,
  },
  {
    nom: "Semestriel",
    description: "Acces libre + cours collectifs",
    prix: 70000,
    dureeValeur: 6,
    dureeUnite: "MOIS" as const,
    ordre: 3,
  },
  {
    nom: "Premium Annuel",
    description: "Acces total + cours collectifs + coach",
    prix: 120000,
    dureeValeur: 1,
    dureeUnite: "ANNEE" as const,
    ordre: 4,
  },
];

function ilYa(jours: number) {
  return new Date(Date.now() - jours * 24 * 60 * 60 * 1000);
}

function numero(sequence: number) {
  return `FITT-${String(sequence).padStart(4, "0")}`;
}

async function main() {
  const gym = await prisma.gym.findFirst({ orderBy: { creeLe: "asc" } });
  if (!gym) {
    throw new Error(
      "Aucune salle en base. Connectez-vous et terminez l'initialisation d'abord.",
    );
  }
  console.log(`Salle ciblee : ${gym.nom} (${gym.id})`);

  // --- Formules ---
  const formulesExistantes = await prisma.formule.count({
    where: { gymId: gym.id },
  });
  if (formulesExistantes > 0) {
    console.log(`${formulesExistantes} formules deja presentes — inchangees.`);
  } else {
    for (const f of FORMULES) {
      await prisma.formule.create({ data: { gymId: gym.id, ...f } });
    }
    console.log(`${FORMULES.length} formules creees.`);
  }

  // --- Adherents ---
  const existants = await prisma.adherent.count({ where: { gymId: gym.id } });
  if (existants > 0) {
    console.log(`${existants} adherents deja presents — inchanges.`);
    await creerAbonnements(gym.id);
    return;
  }

  let sequence = gym.dernierNumeroAdherent;

  for (const m of ADHERENTS) {
    sequence += 1;
    await prisma.adherent.create({
      data: {
        gymId: gym.id,
        numero: numero(sequence),
        prenom: m.prenom,
        nom: m.nom,
        telephone: m.telephone,
        sexe: m.sexe,
        statut: m.statut,
        creeLe: ilYa(m.ilYaJours),
      },
    });
  }

  await prisma.gym.update({
    where: { id: gym.id },
    data: { dernierNumeroAdherent: sequence },
  });

  console.log(
    `${ADHERENTS.length} adherents crees. Dernier numero : ${numero(sequence)}`,
  );

  await creerAbonnements(gym.id);
}

async function creerAbonnements(gymId: string) {
  const dejaLa = await prisma.abonnement.count({ where: { gymId } });
  if (dejaLa > 0) {
    console.log(`${dejaLa} abonnements deja presents — inchanges.`);
    return;
  }

  const formules = await prisma.formule.findMany({
    where: { gymId, actif: true },
    orderBy: { ordre: "asc" },
  });
  const adherents = await prisma.adherent.findMany({
    where: { gymId, statut: { in: ["ACTIF", "EXPIRE"] } },
    orderBy: { creeLe: "desc" },
  });
  if (formules.length === 0 || adherents.length === 0) return;

  // Echeances variees, pour voir les trois seuils de la jauge :
  // rouge (<= 3 j), orange (<= 7 j), normal.
  const ECHEANCES = [2, 5, 6, 12, 28, 45, 90, 142, 200, 310];

  let crees = 0;
  for (const [i, adherent] of adherents.entries()) {
    const formule = formules[i % formules.length];
    const expire = adherent.statut === "EXPIRE";

    // Un expire s'est termine il y a 5 a 60 jours ; un actif court encore.
    const joursAvantFin = expire
      ? -(5 + (i % 55))
      : ECHEANCES[i % ECHEANCES.length];
    const finLe = ilYa(-joursAvantFin);

    // On remonte le debut a partir de la fin, pour que la jauge ait du sens.
    const dureeJours =
      formule.dureeUnite === "ANNEE"
        ? 365 * formule.dureeValeur
        : formule.dureeUnite === "MOIS"
          ? 30 * formule.dureeValeur
          : formule.dureeUnite === "SEMAINE"
            ? 7 * formule.dureeValeur
            : formule.dureeValeur;
    const debutLe = new Date(finLe.getTime() - dureeJours * 86_400_000);

    await prisma.abonnement.create({
      data: {
        gymId,
        adherentId: adherent.id,
        formuleId: formule.id,
        nomFormule: formule.nom,
        prixPaye: formule.prix,
        debutLe,
        finLe,
        statut: expire ? "EXPIRE" : "ACTIF",
      },
    });
    crees++;
  }
  console.log(`${crees} abonnements crees.`);
}

main()
  .catch((e) => {
    console.error("ECHEC :", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
