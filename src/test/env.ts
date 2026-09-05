// Charge les variables d'environnement avant les tests.
//
// Vitest, contrairement a Next.js, ne lit pas .env tout seul : sans ce
// fichier, DATABASE_URL est vide et Prisma echoue sur un message assez
// obscur ("SASL: client password must be a string").
//
// L'ordre reproduit celui de Next.js : .env.local d'abord, .env ensuite.
// dotenv n'ecrase jamais une variable deja definie, donc .env.local gagne —
// c'est bien lui qui porte les valeurs propres a la machine.
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
