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
  schemaNouvelAdherent,
} from "@/lib/data/adherent";

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
