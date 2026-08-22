// Middleware Clerk — s'execute AVANT chaque requete.
// C'est le point de controle unique : une page oubliee ici reste protegee
// par defaut, puisqu'on protege tout sauf ce qui est explicitement public.
//
// /!\ Nom du fichier : "middleware.ts" en Next 15. Il deviendra "proxy.ts"
//     en Next 16 (voir CLAUDE.md §6).
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Les seules routes accessibles sans etre connecte.
// Le "(.*)" attrape les sous-chemins que Clerk cree lui-meme
// (verification d'email, mot de passe oublie, etc.).
const estRoutePublique = createRouteMatcher([
  "/", // la landing page
  "/connexion(.*)",
  "/inscription(.*)",
  // Pre-inscription d'un adherent par lien (§4). Le segment est distinct de
  // /inscription, qui est le SignUp Clerk du STAFF : son catch-all
  // [[...rest]] capturerait le jeton.
  // La page est publique, mais pas ouverte : sans un jeton valide de
  // 32 octets, elle n'affiche rien d'autre qu'un message d'erreur.
  "/rejoindre(.*)",
  // Espace adherent (§5). "Public" ici veut dire "hors Clerk", PAS "ouvert" :
  // aucun adherent n'a de compte Clerk, et ne doit jamais en avoir un (§9).
  // Ces routes ont leur propre controle d'acces, exigerSessionAdherent(),
  // appele en premiere ligne de chaque page — le pendant exact de
  // getTenantContext() cote back-office.
  //   /activer/<jeton> : consommation du lien d'invitation
  //   /espace(...)     : l'espace lui-meme
  "/activer(.*)",
  "/espace(.*)",
  // Ecran affiche par le service worker quand le reseau est coupe
  // (public/sw.js). Exiger une session pour l'afficher serait absurde :
  // c'est precisement la page qui sert quand plus rien n'est joignable, et
  // Clerk ne peut de toute facon pas verifier de session sans reseau.
  // Elle est entierement statique et ne lit aucune donnee de salle.
  "/hors-ligne",
]);

export default clerkMiddleware(async (auth, request) => {
  // Tout ce qui n'est pas declare public exige une session valide.
  if (!estRoutePublique(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Toutes les routes, SAUF les fichiers statiques et les internes de Next.
    // Inutile de faire tourner l'authentification pour servir une image.
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Les routes API, elles, sont toujours controlees.
    "/(api|trpc)(.*)",
  ],
};
