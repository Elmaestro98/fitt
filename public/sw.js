/* =============================================================================
   Service worker de Fitt — ecrit a la main, volontairement.

   Pourquoi pas next-pwa ou Serwist ? Parce que leur configuration par defaut
   met en cache les PAGES, et que Fitt est multi-tenant.

   /!\ LA REGLE QUI PRIME SUR TOUTES LES AUTRES (CLAUDE.md §3)

   Une page HTML de Fitt contient les donnees d'UNE salle. La mettre en cache,
   c'est la poser sur l'appareil sans aucune notion de gymId : sur la tablette
   d'accueil partagee, ou apres qu'un gerant a change de salle avec le
   selecteur Clerk, le cache la resservirait a quelqu'un d'autre. Le service
   worker ne sait pas qui est connecte — il ne peut PAS faire ce tri.

   Donc, ici, on ne met JAMAIS en cache :
     - une reponse de navigation (document HTML) ;
     - une requete non-GET (toutes les Server Actions sont des POST) ;
     - quoi que ce soit sous /api/.

   On ne met en cache QUE ce qui ne contient aucune donnee et qui porte une
   empreinte dans son nom : /_next/static/*, les icones, les polices. Ces
   fichiers sont identiques pour toutes les salles, et un changement de code
   change leur URL.

   Consequence assumee : Fitt ne fonctionne pas hors ligne. Ce n'est pas un
   manque, c'est le prix de l'isolation — et le seul ecran qui DOIT survivre a
   une coupure, la borne de pointage, a deja sa propre file locale
   (src/hooks/use-file-pointage.ts, §9). Le service worker n'y touche pas.
   ========================================================================== */

// Versionner le nom du cache est le seul moyen de le purger : au deploiement
// suivant, incrementer ce numero fait disparaitre l'ancien cache dans
// l'evenement "activate" ci-dessous.
const VERSION = "fitt-v1";
const CACHE_STATIQUE = `${VERSION}-statique`;

// Page servie quand une navigation echoue faute de reseau. Elle est mise en
// cache a l'installation : si on attendait la coupure pour la telecharger,
// elle ne serait jamais disponible au moment ou elle sert.
const PAGE_HORS_LIGNE = "/hors-ligne";

const PRECHARGEMENT = [
  PAGE_HORS_LIGNE,
  "/icone-192.png",
  "/icone-512.png",
  "/logo-fitt.png",
];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_STATIQUE);

      // /! Surtout PAS cache.addAll() ici, pour deux raisons.
      //
      // 1. addAll echoue en bloc si UN seul fichier manque. Un service worker
      //    qui refuse de s'installer parce qu'une icone a ete renommee
      //    couperait tout, y compris la page hors ligne.
      //
      // 2. Et surtout : addAll met en cache une reponse REDIRIGEE telle
      //    quelle. Or une reponse dont redirected vaut true ne peut pas etre
      //    resservie a une navigation — le navigateur refuse avec
      //    "Response served by service worker has redirections", et l'ecran
      //    hors ligne ne s'affiche jamais. Le cas se produit des que Clerk
      //    intercale un aller-retour (le handshake du mode developpement le
      //    fait sur toutes les routes, publiques comprises).
      //
      // On telecharge donc soi-meme, et on ne garde qu'une reponse directe.
      await Promise.allSettled(
        PRECHARGEMENT.map(async (url) => {
          const reponse = await fetch(url, { cache: "reload", redirect: "follow" });
          if (!reponse.ok || reponse.redirected) return;
          await cache.put(url, reponse);
        }),
      );

      // Le nouveau service worker prend la main sans attendre la fermeture
      // de tous les onglets.
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    (async () => {
      // Purge des caches des versions precedentes.
      const noms = await caches.keys();
      await Promise.all(
        noms.filter((nom) => !nom.startsWith(VERSION)).map((nom) => caches.delete(nom)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Ressource sans donnee, immuable, portant une empreinte dans son URL. */
function estRessourceStatique(url) {
  return (
    // Build Next : /_next/static/chunks/abc123.js — le nom change a chaque
    // modification du code, donc un cache permanent ne peut pas etre perime.
    url.pathname.startsWith("/_next/static/") ||
    // Polices Google (Inter, Space Grotesk) chargees par next/font.
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com" ||
    // Icones et images de marque de public/.
    /\.(png|svg|ico|webp|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);

  // --- Tout ce qu'on laisse passer sans y toucher -------------------------
  // Chacune de ces lignes protege quelque chose de precis :

  // 1. Les Server Actions (POST), les mutations, les envois de la file de
  //    pointage. Un service worker qui rejoue une requete non-GET peut
  //    encaisser deux fois le meme paiement.
  if (requete.method !== "GET") return;

  // 2. Les routes API : /api/rapports/export renvoie un CSV construit pour
  //    UNE salle, et les webhooks n'ont rien a faire ici.
  if (url.pathname.startsWith("/api/")) return;

  // 3. Tout ce qui sort du domaine (Clerk, Supabase Storage) sauf les polices
  //    traitees plus bas. On ne s'interpose jamais dans une authentification.
  if (url.origin !== self.location.origin && !estRessourceStatique(url)) return;

  // --- Ressources statiques : cache d'abord -------------------------------
  // Elles ne contiennent aucune donnee de salle et leur URL change des que
  // leur contenu change : on peut les servir depuis le cache sans risque, et
  // c'est ce qui rend le demarrage instantane.
  if (estRessourceStatique(url)) {
    evenement.respondWith(
      (async () => {
        const enCache = await caches.match(requete);
        if (enCache) return enCache;

        try {
          const reponse = await fetch(requete);
          // On ne met en cache qu'une reponse complete et valide. Une reponse
          // partielle (206) ou une erreur mise en cache resterait servie
          // jusqu'a la prochaine version.
          if (reponse.ok && reponse.status === 200) {
            const cache = await caches.open(CACHE_STATIQUE);
            cache.put(requete, reponse.clone());
          }
          return reponse;
        } catch {
          // Hors ligne et absent du cache : on laisse l'erreur remonter, le
          // navigateur affichera l'image cassee. Pas de page HTML en reponse
          // a une demande d'image.
          return Response.error();
        }
      })(),
    );
    return;
  }

  // --- Navigations : reseau UNIQUEMENT ------------------------------------
  // Aucune mise en cache, jamais (voir l'avertissement en tete de fichier).
  // Le seul role du service worker ici est d'afficher une page lisible au
  // lieu du dinosaure du navigateur quand le reseau est coupe.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      (async () => {
        try {
          return await fetch(requete);
        } catch {
          const horsLigne = await caches.match(PAGE_HORS_LIGNE);
          return (
            horsLigne ??
            new Response("Hors ligne", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
  }

  // Tout le reste (donnees RSC, requetes de prefetch...) : on ne repond pas,
  // le navigateur fait son travail normalement.
});
