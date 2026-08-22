import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
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
        </body>
      </html>
    </ClerkProvider>
  );
}
