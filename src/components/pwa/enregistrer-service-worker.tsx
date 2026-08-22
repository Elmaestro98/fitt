"use client";

// Enregistre public/sw.js aupres du navigateur. Sans cet appel, le fichier
// existe mais ne s'execute jamais.
//
// Ce composant ne rend RIEN : c'est un effet, pas une interface. Il est place
// dans le layout racine pour s'executer une fois, quelle que soit la page
// d'arrivee.
import { useEffect } from "react";

export function EnregistrerServiceWorker() {
  useEffect(() => {
    // Absent des navigateurs anciens et de tout contexte non securise. En
    // developpement (http://localhost) le navigateur fait une exception ;
    // en production Vercel sert deja tout en HTTPS.
    if (!("serviceWorker" in navigator)) return;

    // On attend le chargement complet de la page : enregistrer le service
    // worker pendant le rendu initial le met en concurrence avec le
    // telechargement du code de l'application, et retarde le premier
    // affichage sur une connexion lente.
    const enregistrer = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Un echec d'enregistrement ne doit JAMAIS remonter a l'utilisateur :
        // l'application fonctionne parfaitement sans service worker, il
        // n'ajoute que l'installation et l'ecran hors ligne. Afficher une
        // erreur ici inquieterait un gerant pour rien.
      });
    };

    if (document.readyState === "complete") {
      enregistrer();
      return;
    }

    window.addEventListener("load", enregistrer, { once: true });
    return () => window.removeEventListener("load", enregistrer);
  }, []);

  return null;
}
