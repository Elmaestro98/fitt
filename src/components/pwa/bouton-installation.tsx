"use client";

// Bouton "Installer l'application".
//
// Pourquoi il existe : le navigateur propose bien l'installation tout seul,
// mais dans un menu a trois points que personne n'ouvre. Sans bouton visible,
// une PWA n'est jamais installee — et Fitt sur la tablette d'accueil n'a
// d'interet qu'installe, en plein ecran, sans barre d'adresse ou l'on peut
// naviguer ailleurs.
//
// /!\ Piege d'hydratation (CLAUDE.md §6) : ce composant ne peut PAS decider
// de son affichage au premier rendu — le serveur ne sait ni si le navigateur
// est compatible, ni si l'application est deja installee. Il rend donc null
// des deux cotes, puis apparait apres coup. C'est aussi ce qui evite qu'il
// clignote chez qui a deja installe.
import { useEffect, useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** L'evenement n'est pas encore dans les types standards du DOM. */
type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function BoutonInstallation({ className }: { className?: string }) {
  const [invite, setInvite] = useState<EvenementInstallation | null>(null);
  const [surIOS, setSurIOS] = useState(false);
  const [installee, setInstallee] = useState(false);

  useEffect(() => {
    // Deja installee : la fenetre tourne en mode autonome. Rien a proposer.
    const autonome =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari iOS n'implemente pas display-mode et expose ce booleen.
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (autonome) {
      setInstallee(true);
      return;
    }

    // Safari n'emet jamais beforeinstallprompt : sur iPhone et iPad,
    // l'installation passe obligatoirement par le menu Partager. On ne peut
    // donc pas offrir un bouton, seulement expliquer le geste.
    const estIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !/crios|fxios/i.test(navigator.userAgent);
    setSurIOS(estIOS);

    function surInvite(evenement: Event) {
      // Sans preventDefault, Chrome affiche sa propre banniere en bas de
      // l'ecran et l'evenement est perdu : on ne pourrait plus declencher
      // l'installation depuis notre bouton.
      evenement.preventDefault();
      setInvite(evenement as EvenementInstallation);
    }

    function surInstallation() {
      setInvite(null);
      setInstallee(true);
    }

    window.addEventListener("beforeinstallprompt", surInvite);
    window.addEventListener("appinstalled", surInstallation);
    return () => {
      window.removeEventListener("beforeinstallprompt", surInvite);
      window.removeEventListener("appinstalled", surInstallation);
    };
  }, []);

  if (installee) return null;

  // iPhone / iPad : marche a suivre, faute de pouvoir declencher quoi que ce
  // soit. Trois etapes, avec les icones reelles de Safari pour que la
  // personne les reconnaisse a l'ecran.
  if (surIOS) {
    return (
      <div
        className={`animate-apparition rounded-card border border-line bg-sunken p-4 ${className ?? ""}`}
      >
        <p className="display text-sm font-semibold text-ink">
          Installer Fitt sur cet iPhone
        </p>
        <ol className="mt-2 space-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2">
            <Share className="size-4 shrink-0 text-brand" />
            Touchez Partager, en bas de Safari
          </li>
          <li className="flex items-center gap-2">
            <Plus className="size-4 shrink-0 text-brand" />
            Choisissez « Sur l&apos;ecran d&apos;accueil »
          </li>
        </ol>
      </div>
    );
  }

  // Ni invite captee, ni iOS : le navigateur juge les criteres non remplis
  // (pas encore de HTTPS, deuxieme visite pas atteinte...). On n'affiche rien
  // plutot qu'un bouton qui ne ferait rien.
  if (!invite) return null;

  return (
    <Button
      variante="contour"
      className={className}
      onClick={async () => {
        await invite.prompt();
        const { outcome } = await invite.userChoice;
        // L'invite n'est utilisable qu'une fois. Qu'elle soit acceptee ou
        // refusee, on la jette : la rappeler leverait une erreur.
        setInvite(null);
        if (outcome === "accepted") setInstallee(true);
      }}
    >
      <Download className="size-4" />
      Installer l&apos;application
    </Button>
  );
}
