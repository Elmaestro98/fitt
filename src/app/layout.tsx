import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";

// Inter : police du design system (CLAUDE.md §11).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
