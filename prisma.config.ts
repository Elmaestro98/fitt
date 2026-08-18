// Configuration de la CLI Prisma (nouveaute Prisma 7 : les URL ne sont plus
// dans schema.prisma). Ce fichier est versionne — il ne contient AUCUN secret,
// seulement les NOMS des variables lues dans .env.
//
// /!\ IMPORTANT : ce fichier ne concerne QUE la ligne de commande
//     (prisma migrate, prisma db pull, prisma studio...).
//     L'application, elle, se connecte via l'adaptateur PrismaPg dans
//     src/lib/prisma.ts, avec DATABASE_URL (le pooler).
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // DIRECT_URL (port 5432), et surtout PAS le pooler.
    //
    // Le pooler pgbouncer (port 6543) travaille en mode transaction : il ne
    // sait pas maintenir le verrou consultatif que le moteur de migration pose
    // avant de modifier le schema. Resultat : la commande se fige
    // indefiniment, SANS message d'erreur. Diagnostic verifie le 18/08/2026 :
    //   can-connect-to-database sur 5432 -> OK en 2,1 s
    //   can-connect-to-database sur 6543 -> aucune reponse en 25 s
    url: env("DIRECT_URL"),
  },
});
