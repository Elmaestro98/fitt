// Instance unique (singleton) du client Prisma.
//
// Pourquoi un singleton ? Chaque `new PrismaClient()` ouvre son propre pool de
// connexions. En developpement, Next.js recharge les modules a chaque
// sauvegarde de fichier ; sans cette precaution on creerait une instance a
// chaque frappe, jusqu'a saturer les connexions de Supabase.
// Voir CLAUDE.md §6.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Connexion de l'APPLICATION : le pooler (port 6543).
// A ne pas confondre avec prisma.config.ts, qui sert a la CLI et pointe sur
// DIRECT_URL (port 5432) — le pooler fait figer les migrations.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// En dev, on range l'instance dans l'objet global : lui seul survit au
// rechargement a chaud de Next.js.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // En dev on veut voir les requetes SQL dans le terminal ; en production,
    // uniquement les erreurs (sinon les logs Vercel explosent).
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
