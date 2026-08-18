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
