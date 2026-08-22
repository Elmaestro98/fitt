import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { EnregistrerServiceWorker } from "@/components/pwa/enregistrer-service-worker";
import "./globals.css";

// Deux polices, deux roles — voir le bloc "Typographie" de globals.css.
//
// Inter porte la LECTURE : corps de texte, cellules de tableau, formulaires.
// Space Grotesk porte l'IDENTITE : titres, montants, valeurs d'indicateur,
// libelles de boutons. Jamais un paragraphe.
//
// display: "swap" sur les deux : le texte s'affiche immediatement dans la
// police systeme puis bascule. Sur une connexion 3G senegalaise, l'inverse
// (attendre la police) donnerait une page blanche pendant deux secondes.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  // On ne charge que les graisses reellement utilisees : chaque graisse en
  // plus est un fichier a telecharger.
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fitt — Gestion de salle de sport",
  description:
    "Gerez vos adherents, abonnements, paiements et pointages depuis un seul endroit.",

  // --- Installation sur iPhone et iPad -----------------------------------
  // iOS ignore une bonne partie de manifest.webmanifest : ni display, ni
  // theme_color, ni les icones maskable. Ces trois lignes sont le SEUL moyen
  // d'obtenir la meme chose sur Safari.
  appleWebApp: {
    capable: true, // plein ecran, sans barre d'adresse
    title: "Fitt", // libelle sous l'icone
    // "black-translucent" laisse le contenu passer sous la barre d'etat, ce
    // qui masquerait l'heure au-dessus d'un fond clair. "default" garde une
    // barre lisible.
    statusBarStyle: "default",
  },
  icons: {
    // Safari ne lit pas les icones du manifeste : il cherche celle-ci.
    apple: "/apple-icon.png",
  },
  // Les numeros de telephone senegalais (+221 XX XXX XX XX) affiches dans un
  // tableau sont transformes d'office par Safari en liens d'appel bleus et
  // souligne, ce qui casse la mise en page. On desactive la detection : les
  // liens d'appel volontaires (bouton WhatsApp) restent, eux, des liens.
  formatDetection: { telephone: false },
};

// viewport est un export separe depuis Next 14 — le laisser dans metadata
// declencherait un avertissement au build.
export const viewport: Viewport = {
  // Couleur de la barre systeme quand l'application est installee. Le gris
  // sombre de la barre laterale (§11), pour que la fenetre paraisse encadree
  // plutot que posee sur le systeme.
  themeColor: "#2D3133",
  width: "device-width",
  initialScale: 1,
  // /! On NE bloque PAS le zoom (pas de maximumScale ni de user-scalable).
  // Le back-office s'utilise a l'accueil, souvent par quelqu'un qui a besoin
  // d'agrandir un numero de telephone. Interdire le zoom pour "faire plus
  // natif" est une regression d'accessibilite, pas une finition.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider enveloppe TOUTE l'application : c'est lui qui rend
    // l'utilisateur connecte accessible depuis n'importe quel composant.
    // localization={frFR} traduit les ecrans de Clerk en francais (CLAUDE.md §8).
    <ClerkProvider localization={frFR}>
      <html lang="fr">
        <body
          className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        >
          {children}
          {/* Ne rend rien : enregistre public/sw.js une fois la page chargee. */}
          <EnregistrerServiceWorker />
        </body>
      </html>
    </ClerkProvider>
  );
}
