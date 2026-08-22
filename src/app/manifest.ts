// Manifeste PWA. Next.js le sert automatiquement a /manifest.webmanifest et
// insere la balise <link rel="manifest"> dans toutes les pages.
//
// C'est ce fichier qui rend Fitt installable : sans lui, le navigateur ne
// propose jamais "Ajouter a l'ecran d'accueil".
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // id : l'identite stable de l'application installee. Sans lui, un
    // changement de start_url ferait croire au navigateur qu'il s'agit d'une
    // AUTRE application, et l'icone se dupliquerait sur l'ecran d'accueil.
    id: "/",

    name: "Fitt — Gestion de salle de sport",
    // 12 caracteres maximum, c'est ce qui s'affiche SOUS l'icone. Au-dela,
    // Android tronque avec des points de suspension.
    short_name: "Fitt",
    description:
      "Adherents, abonnements, paiements et pointage de votre salle, au meme endroit.",

    // start_url reste la racine : le staff et les adherents sont deux
    // populations distinctes (CLAUDE.md §5) et n'ont pas le meme ecran
    // d'arrivee. La landing oriente vers l'un ou l'autre, et les raccourcis
    // ci-dessous donnent l'acces direct a qui sait ou il va.
    start_url: "/",
    scope: "/",

    // standalone : plus de barre d'adresse ni d'onglets. C'est ce qui fait
    // qu'une PWA ressemble a une application native — et, sur la tablette
    // d'accueil, ce qui empeche quelqu'un de naviguer ailleurs.
    display: "standalone",

    // Fond de l'ecran de demarrage : le gris sombre de la barre laterale
    // (§11). Il correspond a l'ecran de connexion, donc pas de flash blanc
    // entre le lancement et la premiere page.
    background_color: "#2D3133",
    // Couleur de la barre systeme Android une fois l'app ouverte.
    theme_color: "#2D3133",

    lang: "fr",
    dir: "ltr",
    // Aucune orientation imposee : le kiosque de pointage vit en paysage sur
    // une tablette d'accueil, l'espace adherent en portrait sur un telephone.
    orientation: "any",
    categories: ["business", "productivity", "health"],

    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable : Android applique son propre masque (cercle, goutte, carre
      // selon le constructeur) et rogne jusqu'a 20 % de chaque bord. Cette
      // variante-la garde le logo dans les 80 % centraux.
      {
        src: "/icone-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],

    // Raccourcis : appui long sur l'icone installee. Trois usages, trois
    // populations. Ils evitent de repasser par la landing a chaque ouverture.
    shortcuts: [
      {
        name: "Pointage",
        short_name: "Pointage",
        description: "Ouvrir la borne de pointage",
        url: "/pointage",
        icons: [{ src: "/icone-192.png", sizes: "192x192" }],
      },
      {
        name: "Adherents",
        short_name: "Adherents",
        description: "Chercher un adherent",
        url: "/adherents",
        icons: [{ src: "/icone-192.png", sizes: "192x192" }],
      },
      {
        name: "Mon espace",
        short_name: "Mon espace",
        description: "Espace adherent",
        url: "/espace",
        icons: [{ src: "/icone-192.png", sizes: "192x192" }],
      },
    ],
  };
}
