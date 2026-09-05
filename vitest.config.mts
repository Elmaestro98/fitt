// Configuration des tests.
//
// Il n'y a qu'une suite dans ce projet, et c'est volontaire : l'isolation
// multi-tenant (CLAUDE.md §3). C'est la seule regle dont la violation est a la
// fois INVISIBLE — l'ecran s'affiche normalement, avec les donnees de la
// mauvaise salle — et mortelle pour le produit. Tout le reste se voit a
// l'usage ; ca, non.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/test/**/*.test.ts"],
    // Charge .env / .env.local, que Vitest ne lit pas de lui-meme.
    setupFiles: ["./src/test/env.ts"],
    // Les tests ecrivent dans une VRAIE base et se partagent deux salles
    // fictives : les faire tourner en parallele les ferait se marcher dessus
    // (une suite nettoie pendant qu'une autre lit).
    fileParallelism: false,
    // Supabase est distant : une requete peut prendre une seconde. Le defaut
    // de 5 s produirait des echecs qui ne disent rien du code.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      // Le meme alias que tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" est un garde-fou de compilation : hors du moteur React,
      // son import LEVE une erreur. Il n'a rien a proteger dans un test qui
      // tourne deja cote serveur, on le remplace donc par un module vide.
      "server-only": fileURLToPath(
        new URL("./src/test/vide.ts", import.meta.url),
      ),
    },
  },
});
