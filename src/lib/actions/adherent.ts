"use server";

// Server Actions du domaine adherent (CLAUDE.md §7 : mutations via Server
// Actions, jamais via des routes API sauf webhooks).
//
// "use server" en tete du fichier : tout ce qui est exporte ici devient un
// point d'entree appelable depuis le navigateur. Donc TOUT ce qui est exporte
// doit valider ses entrees et resoudre son tenant lui-meme.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  changerStatutAdherent,
  creerAdherent,
  importerAdherents,
  modifierAdherent,
  schemaNouvelAdherent,
  telephonesExistants,
  type NouvelAdherent,
} from "@/lib/data/adherent";
import { parserCSV, type LigneCSV } from "@/lib/utils/csv";

export type EtatFormulaire = {
  erreurs?: Record<string, string[] | undefined>;
  message?: string;
};

/** Erreur Prisma "contrainte d'unicite violee". */
function estDoublon(e: unknown): e is { code: string; meta?: { target?: unknown } } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  );
}

/**
 * Un <input> vide envoie "" et non undefined. Sans ce nettoyage, un champ
 * facultatif laisse vide echouerait la validation (ex. z.coerce.date() sur ""
 * produit une date invalide).
 */
function nettoyer(formData: FormData) {
  const objet: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur === "string" && valeur.trim() !== "") {
      objet[cle] = valeur;
    }
  }
  return objet;
}

export async function actionCreerAdherent(
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  // --- Barriere 1 : la forme des donnees (Zod, cote serveur) -------------
  // Les attributs "required" du HTML sont une aide a la saisie, pas une
  // securite : n'importe qui peut les retirer dans les outils du navigateur.
  const resultat = schemaNouvelAdherent.safeParse(nettoyer(formData));

  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  // --- Barriere 2 : le tenant --------------------------------------------
  // creerAdherent() appelle getTenantContext() : aucun gymId ne transite par
  // le formulaire (§9 : exposer gymId dans un formulaire est un interdit).
  try {
    await creerAdherent(resultat.data);
  } catch (erreur) {
    // --- Barriere 3 : les contraintes de la base -------------------------
    // Deux receptionnistes peuvent saisir le meme numero a une seconde
    // d'intervalle : seule la base peut trancher, et elle le fait.
    if (estDoublon(erreur)) {
      return {
        erreurs: {
          telephone: ["Un adherent de cette salle utilise deja ce numero."],
        },
      };
    }
    return {
      message:
        "L'enregistrement a echoue. Verifiez votre connexion et reessayez.",
    };
  }

  // Vide le cache de la liste : sans ca, le nouvel adherent n'apparaitrait
  // qu'apres un rechargement force.
  revalidatePath("/adherents");

  // redirect() fonctionne en levant une exception interne a Next : il doit
  // rester HORS du try/catch, sinon le catch l'intercepterait.
  redirect("/adherents");
}

/* --- Modification -------------------------------------------------------- */

/**
 * L'id arrive en PREMIER argument, pas dans un champ cache du formulaire.
 * La page appelle :  actionModifierAdherent.bind(null, adherent.id)
 *
 * .bind() fige la valeur cote serveur : elle n'est jamais serialisee dans le
 * HTML, donc l'utilisateur ne peut pas la remplacer par l'id d'un autre
 * adherent depuis les outils du navigateur. Le filtre gymId de
 * modifierAdherent reste la deuxieme protection.
 */
export async function actionModifierAdherent(
  id: string,
  _precedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaNouvelAdherent.safeParse(nettoyer(formData));

  if (!resultat.success) {
    return { erreurs: z.flattenError(resultat.error).fieldErrors };
  }

  try {
    await modifierAdherent(id, resultat.data);
  } catch (erreur) {
    if (estDoublon(erreur)) {
      return {
        erreurs: {
          telephone: ["Un autre adherent de cette salle utilise deja ce numero."],
        },
      };
    }
    return {
      message: "La modification a echoue. Verifiez votre connexion et reessayez.",
    };
  }

  revalidatePath("/adherents");
  revalidatePath(`/adherents/${id}`);

  redirect(`/adherents/${id}`);
}

/* --- Changement de statut ------------------------------------------------ */

/* Les seules transitions autorisees depuis l'interface. EXPIRE n'y figure
   pas : ce statut est pose par le systeme quand l'abonnement s'acheve, jamais
   a la main. EN_ATTENTE_VALIDATION vient du parcours d'invitation. */
const STATUTS_MANUELS = ["ACTIF", "SUSPENDU", "ARCHIVE"] as const;

export async function actionChangerStatut(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const statut = String(formData.get("statut") ?? "");

  if (!id) return;
  // Le champ vient d'un formulaire : on n'accepte que la liste blanche.
  if (!STATUTS_MANUELS.includes(statut as (typeof STATUTS_MANUELS)[number])) {
    return;
  }

  await changerStatutAdherent(
    id,
    statut as (typeof STATUTS_MANUELS)[number],
  );

  revalidatePath("/adherents");
  revalidatePath(`/adherents/${id}`);
}

/* --- Import CSV ------------------------------------------------------------
   Deux etapes, deux actions : actionApercuImportCSV ne persiste RIEN, elle
   se contente de parser et valider pour montrer au staff ce qui serait
   importe. C'est actionConfirmerImportCSV, appelee sur un second formulaire,
   qui ecrit reellement en base — apres une revalidation complete, jamais sur
   la seule confiance du champ cache qui transporte les lignes validees. */

export type LigneImportOk = { ligne: number; identifiant: string; donnees: NouvelAdherent };
export type LigneImportErreur = { ligne: number; identifiant: string; erreurs: string[] };

export type EtatImport = {
  message?: string;
  apercu?: {
    valides: LigneImportOk[];
    erreurs: LigneImportErreur[];
    doublonsEnBase: number;
  };
};

/* Alias acceptes pour chaque colonne, entetes deja normalisees (minuscules,
   sans accents) par parserCSV. Un gerant qui exporte depuis Excel n'a pas a
   connaitre nos noms de champs internes. */
const ALIAS_ENTETES: Record<string, string[]> = {
  prenom: ["prenom", "first name", "firstname"],
  nom: ["nom", "nom de famille", "last name", "lastname"],
  telephone: ["telephone", "tel", "phone", "numero", "numero de telephone", "num tel"],
  email: ["email", "e-mail", "mail"],
  sexe: ["sexe", "genre"],
  dateNaissance: ["date de naissance", "naissance", "date naissance", "ddn"],
  adresse: ["adresse", "address"],
};

function trouverValeur(ligne: LigneCSV, cles: string[]): string {
  for (const cle of cles) {
    if (ligne[cle] !== undefined && ligne[cle] !== "") return ligne[cle];
  }
  return "";
}

/** "H" / "Homme" / "M" -> "HOMME" ; laisse tel quel si non reconnu, pour que
    Zod produise un message d'erreur clair plutot qu'un silence. */
function normaliserSexe(v: string): string {
  const s = v.trim().toLowerCase();
  if (["h", "homme", "m", "masculin"].includes(s)) return "HOMME";
  if (["f", "femme", "feminin"].includes(s)) return "FEMME";
  return v;
}

/** "18/08/1990" -> "1990-08-18" : format europeen tel qu'Excel FR l'ecrit,
    que z.coerce.date() ne saurait pas lire correctement tel quel. */
function normaliserDateFR(v: string): string {
  const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return v.trim();
  const [, j, mo, a] = m;
  return `${a}-${mo.padStart(2, "0")}-${j.padStart(2, "0")}`;
}

const MAX_LIGNES_IMPORT = 1000;

export async function actionApercuImportCSV(
  _precedent: EtatImport,
  formData: FormData,
): Promise<EtatImport> {
  const fichier = formData.get("fichier");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { message: "Choisissez un fichier CSV a importer." };
  }

  const texte = await fichier.text();
  const lignesCSV = parserCSV(texte);

  if (lignesCSV.length === 0) {
    return { message: "Le fichier est vide ou illisible." };
  }
  if (lignesCSV.length > MAX_LIGNES_IMPORT) {
    return {
      message: `Ce fichier contient plus de ${MAX_LIGNES_IMPORT} lignes. Scindez-le en plusieurs imports.`,
    };
  }

  const valides: LigneImportOk[] = [];
  const erreurs: LigneImportErreur[] = [];
  const telephonesVus = new Set<string>();

  for (const [index, ligneCSV] of lignesCSV.entries()) {
    // +1 pour l'entete, +1 pour repasser en numerotation a partir de 1.
    const numeroLigne = index + 2;

    const brut: Record<string, string> = {
      prenom: trouverValeur(ligneCSV, ALIAS_ENTETES.prenom),
      nom: trouverValeur(ligneCSV, ALIAS_ENTETES.nom),
      telephone: trouverValeur(ligneCSV, ALIAS_ENTETES.telephone),
      email: trouverValeur(ligneCSV, ALIAS_ENTETES.email),
      sexe: normaliserSexe(trouverValeur(ligneCSV, ALIAS_ENTETES.sexe)),
      dateNaissance: normaliserDateFR(trouverValeur(ligneCSV, ALIAS_ENTETES.dateNaissance)),
      adresse: trouverValeur(ligneCSV, ALIAS_ENTETES.adresse),
    };

    const identifiant = `${brut.prenom} ${brut.nom}`.trim() || `ligne ${numeroLigne}`;

    // Meme barriere Zod que la creation manuelle (§7) : un import n'est pas
    // une voie parallele avec ses propres regles de validation.
    const resultat = schemaNouvelAdherent.safeParse(
      Object.fromEntries(Object.entries(brut).filter(([, v]) => v !== "")),
    );

    if (!resultat.success) {
      erreurs.push({
        ligne: numeroLigne,
        identifiant,
        erreurs: Object.values(z.flattenError(resultat.error).fieldErrors)
          .flat()
          .filter((m): m is string => Boolean(m)),
      });
      continue;
    }

    const telephone = resultat.data.telephone!;
    if (telephonesVus.has(telephone)) {
      erreurs.push({
        ligne: numeroLigne,
        identifiant,
        erreurs: ["Telephone en double dans le fichier."],
      });
      continue;
    }
    telephonesVus.add(telephone);

    valides.push({ ligne: numeroLigne, identifiant, donnees: resultat.data });
  }

  // On n'ecrase jamais une fiche existante depuis un import (§9 : jamais de
  // suppression/reecriture silencieuse) — un telephone deja connu de la
  // salle est simplement ecarte, pas fusionne.
  const existants = await telephonesExistants(
    valides.map((v) => v.donnees.telephone!),
  );
  const aImporter = valides.filter((v) => !existants.has(v.donnees.telephone!));
  const doublonsEnBase = valides.length - aImporter.length;

  if (aImporter.length === 0 && erreurs.length === 0) {
    return { message: "Aucune ligne exploitable dans ce fichier." };
  }

  return { apercu: { valides: aImporter, erreurs, doublonsEnBase } };
}

export async function actionConfirmerImportCSV(
  _precedent: EtatImport,
  formData: FormData,
): Promise<EtatImport> {
  const brut = formData.get("lignes");
  if (typeof brut !== "string") {
    return { message: "Session d'import expiree, recommencez depuis le fichier." };
  }

  let donnees: unknown;
  try {
    donnees = JSON.parse(brut);
  } catch {
    return { message: "Donnees d'import illisibles, recommencez depuis le fichier." };
  }

  // Le champ cache vient du navigateur : jamais de confiance aveugle, meme
  // s'il n'a fait qu'aller-retour depuis notre propre apercu quelques
  // secondes plus tot. Revalidation complete, ligne par ligne (§7).
  const resultat = z.array(schemaNouvelAdherent).safeParse(donnees);
  if (!resultat.success) {
    return { message: "Donnees d'import invalides, recommencez depuis le fichier." };
  }

  await importerAdherents(resultat.data);

  revalidatePath("/adherents");
  redirect("/adherents");
}
