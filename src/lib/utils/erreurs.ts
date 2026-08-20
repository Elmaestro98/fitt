// Aide partagee par les Server Actions.
//
// Distingue une erreur METIER (levee volontairement depuis lib/data/*, avec
// un message deja redige pour l'utilisateur — "Abonnement introuvable ou
// deja annule") d'une erreur PRISMA brute et imprevue (contrainte non geree,
// base injoignable...), dont le message technique ne doit jamais atteindre
// l'ecran d'un gerant qui ne sait pas coder.
//
// Les erreurs Prisma portent toujours un code de la forme "P2002", "P2025" :
// c'est ce qui les distingue d'un simple `throw new Error("...")` maison.
function estErreurPrisma(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    "code" in erreur &&
    typeof (erreur as { code: unknown }).code === "string" &&
    /^P\d{4}$/.test((erreur as { code: string }).code)
  );
}

export function messageErreur(erreur: unknown, repli: string): string {
  if (erreur instanceof Error && !estErreurPrisma(erreur)) {
    return erreur.message;
  }
  return repli;
}
