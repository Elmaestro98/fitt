// =============================================================================
// Contexte SUPER ADMIN — la vue AFRICATECHNOLOGIE sur l'ensemble des salles.
//
// C'est le pendant EXACT de tenant.ts, pour un public totalement different :
// getTenantContext() resout UNE salle et interdit d'en sortir (§3) ;
// getSuperAdminContext() ne resout aucune salle et autorise precisement a en
// sortir. Les deux ne doivent jamais se confondre, d'ou ce fichier separe
// plutot qu'une variante ajoutee a tenant.ts.
//
// /!\ Reconnaissance du Super Admin : un attribut publicMetadata.superAdmin
// pose directement sur le compte Clerk, verifie en le relisant depuis l'API
// Clerk (jamais depuis les claims du token de session, qui peuvent rester
// perimes apres un changement de metadonnee). Rien lie a une organisation :
// plus simple qu'une organisation dediee, et evite toute confusion avec le
// mecanisme d'organisation-par-salle qui structure le reste de l'app.
//
// Si l'attribut est absent ou different de true, AUCUN compte n'est reconnu
// Super Admin — on echoue ferme, jamais ouvert.
// =============================================================================
import "server-only";

import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";

export class AccesSuperAdminRefuseError extends Error {
  constructor() {
    super("Acces reserve a l'equipe AFRICATECHNOLOGIE");
    this.name = "AccesSuperAdminRefuseError";
  }
}

export type ContexteSuperAdmin = {
  userId: string;
};

export const getSuperAdminContext = cache(
  async (): Promise<ContexteSuperAdmin> => {
    const { userId } = await auth();
    if (!userId) throw new AccesSuperAdminRefuseError();

    const clerk = await clerkClient();
    const utilisateur = await clerk.users.getUser(userId);

    if (utilisateur.publicMetadata?.superAdmin !== true) {
      throw new AccesSuperAdminRefuseError();
    }

    return { userId };
  },
);
