// =============================================================================
// L'ISOLATION MULTI-TENANT (CLAUDE.md §3).
//
// La regle qui prime sur toutes les autres : "une fuite de donnees entre deux
// salles clientes tue le produit". Elle etait jusqu'ici garantie par la seule
// discipline de celui qui ecrit le code. Ce fichier la rend mecanique.
//
// Pourquoi elle merite des tests alors que le reste du produit n'en a pas :
// une fuite inter-tenant est INVISIBLE. Rien ne plante, aucune erreur ne
// s'affiche — l'ecran se remplit normalement, avec les donnees de la mauvaise
// salle. On ne l'apprend que par un client, et ce jour-la c'est fini. Tout le
// reste du produit se voit a l'usage ; ca, non.
//
// La forme de chaque test est toujours la meme : deux salles completes et
// identiques, on se connecte a l'une, et on verifie qu'AUCUN identifiant de
// l'autre ne remonte. Une fonction qui aurait oublie son filtre gymId
// renverrait les deux.
// =============================================================================
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  creerDeuxSalles,
  effacerSalles,
  type SalleFictive,
} from "./deux-salles";

/* --- Les trois mocks, et pourquoi ------------------------------------------ */

// L'etat de la session Clerk, que chaque test deplace d'une salle a l'autre.
// vi.hoisted : vi.mock est remonte en tete de fichier par Vitest, il ne peut
// donc pas capturer une variable declaree normalement plus bas.
const session = vi.hoisted(() => ({
  userId: "user_test" as string | null,
  orgId: null as string | null,
}));

// 1. Clerk. C'est LA source du gymId (§3) : la remplacer, c'est se mettre
//    exactement dans la position d'un membre du staff connecte a une salle.
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({
    userId: session.userId,
    orgId: session.orgId,
    orgRole: "org:admin",
  }),
}));

// 2. Supabase Storage. Piege deja documente au §6 : @supabase/supabase-js
//    instancie un RealtimeClient des l'import, et celui-ci exige un WebSocket
//    natif que Node 20 n'a pas. L'application n'est pas concernee (Next.js en
//    fournit un), mais Vitest tourne dans un Node nu : sans ce mock, tout
//    fichier qui remonte jusqu'a lib/data/stockage.ts fait echouer la suite
//    sur une erreur qui n'a aucun rapport avec le multi-tenant.
//
//    Le remplacer ne cache rien : le stockage de fichiers ne participe pas a
//    l'isolation, aucun test ici ne televerse quoi que ce soit.
vi.mock("@/lib/supabase", () => ({ supabase: {} }));

// 3. cache() de React. getTenantContext en est enveloppe pour ne pas relire la
//    ligne `gyms` cinq fois par rendu. Hors du moteur React il n'y a pas de
//    "rendu" qui delimiterait la memorisation : sans ce mock, le contexte de
//    la premiere salle risquerait de survivre au changement de session et
//    tous les tests suivants passeraient pour une mauvaise raison.
//
//    Ce n'est pas une triche : en production, cache() ne memorise QUE le temps
//    d'une requete. D'une requete a l'autre, la resolution est refaite — ce
//    que reproduit exactement l'identite ci-dessous. Le test "change de salle"
//    plus bas verifie d'ailleurs que la bascule fonctionne vraiment.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return { ...react, cache: <T,>(fn: T) => fn };
});

/* --- Le decor ------------------------------------------------------------- */

let salleA: SalleFictive;
let salleB: SalleFictive;

/** Se connecter au back-office de cette salle, comme un membre de son staff. */
function connecterA(salle: SalleFictive) {
  session.userId = "user_test";
  session.orgId = salle.clerkOrgId;
}

beforeAll(async () => {
  [salleA, salleB] = await creerDeuxSalles();
});

afterAll(async () => {
  // Toujours, meme si un test a echoue : sinon la base garde des salles
  // fantomes qui fausseraient les compteurs du Super Admin.
  await effacerSalles([salleA, salleB].filter(Boolean));
});

/** Les identifiants d'une liste, quelle que soit sa forme. */
function ids(lignes: ReadonlyArray<{ id: string }>): string[] {
  return lignes.map((l) => l.id);
}

/* =============================================================================
   1. La porte d'entree elle-meme
   ========================================================================== */

describe("getTenantContext — la porte d'entree", () => {
  it("resout la salle de l'organisation connectee", async () => {
    const { getTenantContext } = await import("@/lib/tenant");

    connecterA(salleA);
    expect((await getTenantContext()).gymId).toBe(salleA.gymId);
  });

  it("change reellement de salle quand la session change", async () => {
    // /!\ Ce test garde les autres. Si cache() memorisait d'un test a
    // l'autre, tous les suivants interrogeraient la salle A en croyant
    // interroger la B — et passeraient sans rien prouver. Celui-ci tombe le
    // premier si cela arrive.
    const { getTenantContext } = await import("@/lib/tenant");

    connecterA(salleA);
    const premier = (await getTenantContext()).gymId;

    connecterA(salleB);
    const second = (await getTenantContext()).gymId;

    expect(premier).toBe(salleA.gymId);
    expect(second).toBe(salleB.gymId);
    expect(premier).not.toBe(second);
  });

  it("refuse une session sans organisation active", async () => {
    const { getTenantContext, AucuneSalleActiveError } = await import(
      "@/lib/tenant"
    );

    session.userId = "user_test";
    session.orgId = null;

    await expect(getTenantContext()).rejects.toBeInstanceOf(
      AucuneSalleActiveError,
    );
  });

  it("refuse une organisation qui ne correspond a aucune salle", async () => {
    const { getTenantContext, SalleIntrouvableError } = await import(
      "@/lib/tenant"
    );

    session.userId = "user_test";
    session.orgId = "org_qui_nexiste_pas_du_tout";

    await expect(getTenantContext()).rejects.toBeInstanceOf(
      SalleIntrouvableError,
    );
  });

  it("refuse une session non authentifiee", async () => {
    const { getTenantContext, NonAuthentifieError } = await import(
      "@/lib/tenant"
    );

    session.userId = null;
    session.orgId = null;

    await expect(getTenantContext()).rejects.toBeInstanceOf(
      NonAuthentifieError,
    );
  });
});

/* =============================================================================
   2. Les listes : aucune ne doit traverser le mur
   ========================================================================== */

describe("Adherents", () => {
  it("listerAdherents ne rend que les adherents de sa salle", async () => {
    const { listerAdherents } = await import("@/lib/data/adherent");

    connecterA(salleA);
    const vueA = await listerAdherents();

    expect(ids(vueA.adherents)).toContain(salleA.adherentId);
    expect(ids(vueA.adherents)).not.toContain(salleB.adherentId);
  });

  it("la recherche ne traverse pas les murs", async () => {
    // Le nom cherche n'existe QUE dans la salle A. Depuis la salle B, il ne
    // doit rien donner — pas meme une correspondance partielle.
    const { rechercheRapideAdherents } = await import("@/lib/data/adherent");

    connecterA(salleB);
    const { resultats, total } = await rechercheRapideAdherents(
      salleA.nomAdherent,
    );

    expect(ids(resultats)).not.toContain(salleA.adherentId);
    expect(resultats).toHaveLength(0);
    // Le compteur aussi : afficher "1 resultat" puis une liste vide serait
    // deja une fuite — on apprendrait que ce nom existe ailleurs.
    expect(total).toBe(0);
  });

  it("connaitre l'id d'un adherent d'une autre salle ne suffit pas a le lire", async () => {
    // Le scenario le plus direct : un identifiant vu dans une URL, rejoue par
    // quelqu'un d'une autre salle. C'est la raison du findFirst + gymId a la
    // place d'un findUnique.
    const { trouverAdherent } = await import("@/lib/data/adherent");

    connecterA(salleB);
    expect(await trouverAdherent(salleA.adherentId)).toBeNull();

    connecterA(salleA);
    expect(await trouverAdherent(salleA.adherentId)).not.toBeNull();
  });

  it("compterParStatut ne compte que sa salle", async () => {
    const { compterParStatut } = await import("@/lib/data/adherent");

    connecterA(salleA);
    const compteurs = await compterParStatut();
    const total = Object.values(compteurs).reduce(
      (somme: number, n) => somme + (typeof n === "number" ? n : 0),
      0,
    );

    // La salle A n'a qu'un adherent. Si le filtre sautait, on en verrait deux.
    expect(total).toBe(1);
  });
});

describe("Abonnements", () => {
  it("listerAbonnements ne rend que les siens", async () => {
    const { listerAbonnements } = await import("@/lib/data/abonnement");

    connecterA(salleA);
    const vue = await listerAbonnements({});

    expect(ids(vue.abonnements)).toContain(salleA.abonnementId);
    expect(ids(vue.abonnements)).not.toContain(salleB.abonnementId);
  });

  it("listerAbonnementsAdherent refuse l'adherent d'une autre salle", async () => {
    const { listerAbonnementsAdherent } = await import(
      "@/lib/data/abonnement"
    );

    connecterA(salleB);
    expect(await listerAbonnementsAdherent(salleA.adherentId)).toHaveLength(0);
  });

  it("synchroniserExpirations ne touche pas les abonnements d'a cote", async () => {
    // Le seul test qui verifie une ECRITURE. Une mise a jour de masse sans
    // filtre gymId serait la pire des fuites : elle ne lirait pas les donnees
    // de l'autre salle, elle les MODIFIERAIT.
    const { synchroniserExpirations } = await import("@/lib/data/abonnement");
    const { prisma } = await import("@/lib/prisma");

    connecterA(salleA);
    await synchroniserExpirations();

    const voisin = await prisma.abonnement.findUnique({
      where: { id: salleB.abonnementId },
    });
    expect(voisin?.statut).toBe("ACTIF");
  });
});

describe("Paiements", () => {
  it("le journal de caisse s'arrete aux murs de la salle", async () => {
    const { listerPaiements } = await import("@/lib/data/paiement");

    connecterA(salleA);
    const vue = await listerPaiements({});

    expect(ids(vue.paiements)).toContain(salleA.paiementId);
    expect(ids(vue.paiements)).not.toContain(salleB.paiementId);
    // Le total porte sur la selection : il ne doit compter que 15 000, pas
    // les 30 000 des deux salles reunies.
    expect(vue.montantTotal).toBe(15000);
  });

  it("paiementsAdherent refuse l'adherent d'une autre salle", async () => {
    const { paiementsAdherent } = await import("@/lib/data/paiement");

    connecterA(salleB);
    const vue = await paiementsAdherent(salleA.adherentId);
    const lignes = Array.isArray(vue) ? vue : (vue as { paiements: unknown[] }).paiements;

    expect(lignes).toHaveLength(0);
  });
});

describe("Pointage", () => {
  it("la borne ne charge que les adherents de sa salle", async () => {
    // Cas particulierement sensible : cette liste part ENTIERE dans le
    // navigateur d'une borne en libre service, a l'entree de la salle.
    const { adherentsPourKiosque } = await import("@/lib/data/pointage");

    connecterA(salleA);
    const liste = await adherentsPourKiosque();

    expect(ids(liste)).toContain(salleA.adherentId);
    expect(ids(liste)).not.toContain(salleB.adherentId);
  });

  it("les derniers passages restent dans la salle", async () => {
    const { derniersPassages } = await import("@/lib/data/pointage");

    connecterA(salleA);
    const passages = await derniersPassages(50);

    expect(ids(passages)).toContain(salleA.pointageId);
    expect(ids(passages)).not.toContain(salleB.pointageId);
  });

  it("le registre de presence ne montre que sa salle", async () => {
    const { listerPointages } = await import("@/lib/data/pointage");

    connecterA(salleA);
    const vue = await listerPointages({});

    expect(ids(vue.passages)).toContain(salleA.pointageId);
    expect(ids(vue.passages)).not.toContain(salleB.pointageId);
  });

  it("l'export CSV du registre ne fuit pas non plus", async () => {
    // Un export est le pire endroit ou fuiter : le fichier part sur un poste,
    // dans une piece jointe, chez un comptable.
    const { lignesExportRegistre } = await import("@/lib/data/pointage");

    connecterA(salleA);
    const lignes = await lignesExportRegistre({});

    const noms = lignes.map((l) => l.adherent.nom);
    expect(noms).toContain(salleA.nomAdherent);
    expect(noms).not.toContain(salleB.nomAdherent);
  });

  it("enregistrerPointages refuse un adherent d'une autre salle", async () => {
    // Les identifiants viennent du navigateur d'une borne : ils ne meritent
    // aucune confiance.
    const { enregistrerPointages } = await import("@/lib/data/pointage");
    const { prisma } = await import("@/lib/prisma");

    connecterA(salleA);
    const bilan = await enregistrerPointages([
      {
        cleLocale: `intrusion-${Date.now()}`,
        adherentId: salleB.adherentId,
        horodatage: new Date(),
        source: "KIOSQUE",
      },
    ]);

    expect(bilan.enregistres).toBe(0);

    // Et rien n'a ete ecrit sur le compte de la salle B.
    const passagesB = await prisma.pointage.count({
      where: { gymId: salleB.gymId },
    });
    expect(passagesB).toBe(1);
  });
});

describe("Formules, produits, commandes", () => {
  it("listerFormules ne rend que les siennes", async () => {
    const { listerFormules } = await import("@/lib/data/formule");

    connecterA(salleA);
    const formules = await listerFormules({ inclureArchivees: true });

    expect(ids(formules)).toContain(salleA.formuleId);
    expect(ids(formules)).not.toContain(salleB.formuleId);
  });

  it("listerProduits ne rend que les siens", async () => {
    const { listerProduits } = await import("@/lib/data/produit");

    connecterA(salleA);
    const produits = await listerProduits({ inclureArchives: true });

    expect(ids(produits)).toContain(salleA.produitId);
    expect(ids(produits)).not.toContain(salleB.produitId);
  });

  it("listerCommandes ne rend que les siennes", async () => {
    const { listerCommandes } = await import("@/lib/data/commande");

    connecterA(salleA);
    const commandes = await listerCommandes("en_cours");

    expect(ids(commandes)).toContain(salleA.commandeId);
    expect(ids(commandes)).not.toContain(salleB.commandeId);
  });
});

describe("Cours et coachs", () => {
  it("listerCoachs ne rend que les siens", async () => {
    const { listerCoachs } = await import("@/lib/data/coach");

    connecterA(salleA);
    const coachs = await listerCoachs({ inclureArchives: true });

    expect(ids(coachs)).toContain(salleA.coachId);
    expect(ids(coachs)).not.toContain(salleB.coachId);
  });

  it("listerTypesCours ne rend que les siens", async () => {
    const { listerTypesCours } = await import("@/lib/data/type-cours");

    connecterA(salleA);
    const types = await listerTypesCours({ inclureArchives: true });

    expect(ids(types)).toContain(salleA.typeCoursId);
    expect(ids(types)).not.toContain(salleB.typeCoursId);
  });

  it("le planning ne montre pas les seances d'a cote", async () => {
    const { listerSessionsCours } = await import("@/lib/data/session-cours");

    connecterA(salleA);
    const seances = await listerSessionsCours({ inclureAnnulees: true });

    expect(ids(seances)).not.toContain(salleB.sessionCoursId);
  });

  it("trouverSessionCours refuse la seance d'une autre salle", async () => {
    const { trouverSessionCours } = await import("@/lib/data/session-cours");

    connecterA(salleB);
    expect(await trouverSessionCours(salleA.sessionCoursId)).toBeNull();
  });
});

describe("Retention", () => {
  it("le decrochage ne regarde que sa salle", async () => {
    const { adherentsQuiDecrochent } = await import("@/lib/data/decrochage");

    connecterA(salleA);
    // Seuil a 0 jour : les deux adherents remplissent alors la condition.
    // Seul celui de la salle A doit apparaitre.
    const lignes = await adherentsQuiDecrochent(0);

    expect(ids(lignes)).not.toContain(salleB.adherentId);
  });
});

/* =============================================================================
   3. Le garde-fou structurel
   ========================================================================== */

describe("La couche de donnees, dans son ensemble", () => {
  it("aucun fichier de lib/data n'interroge Prisma sans resoudre un tenant", async () => {
    // Les tests ci-dessus couvrent les fonctions existantes. Celui-ci couvre
    // celles qui n'existent pas encore : le jour ou quelqu'un ajoute
    // lib/data/nouvelle-entite.ts en oubliant getTenantContext, il tombe —
    // meme si personne n'a pense a ecrire le test correspondant.
    const { readdir, readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const dossier = join(process.cwd(), "src", "lib", "data");
    const fichiers = (await readdir(dossier)).filter((f) => f.endsWith(".ts"));

    // Les trois seules facons legitimes de resoudre a qui appartiennent les
    // donnees qu'on va lire.
    const portes = [
      "getTenantContext",
      "exigerSessionAdherent",
      "lireSessionAdherent",
      // La console AFRICATECHNOLOGIE, seule exception assumee du §3 : elle
      // lit toutes les salles, par nature.
      "getSuperAdminContext",
    ];

    const fautifs: string[] = [];

    for (const fichier of fichiers) {
      const source = await readFile(join(dossier, fichier), "utf8");
      if (!source.includes("prisma.")) continue;
      if (portes.some((porte) => source.includes(porte))) continue;
      fautifs.push(fichier);
    }

    expect(fautifs).toEqual([]);
  });
});
