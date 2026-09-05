// =============================================================================
// L'adresse publique du site, telle que le navigateur l'a vue.
//
// Ecrite ici parce qu'elle a maintenant TROIS appelants : les liens
// d'inscription (actions/invitation.ts), les invitations a l'espace adherent
// (actions/espace-adherent.ts) et le QR du code du jour (data/gym.ts). Les
// deux premiers la portaient chacun en copie, avec une note qui disait
// exactement quoi faire le jour ou un troisieme apparaitrait — c'est ce jour.
//
// Le meme raisonnement que lib/utils/acces-salle.ts : une regle recopiee
// finit par diverger, et ici la divergence produirait des liens qui pointent
// vers le mauvais domaine, donc des adherents qui n'accedent a rien.
// =============================================================================
import "server-only";

import { headers } from "next/headers";

/**
 * Deduite des en-tetes plutot que d'une variable d'environnement : le lien
 * fonctionne ainsi en local (localhost:3001), sur une preview Vercel et en
 * production, sans configuration. NEXT_PUBLIC_APP_URL reste prioritaire si
 * elle est definie, pour le cas d'un nom de domaine personnalise.
 */
export async function origineRequete(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  const enTetes = await headers();
  const hote = enTetes.get("x-forwarded-host") ?? enTetes.get("host") ?? "";
  const protocole =
    enTetes.get("x-forwarded-proto") ??
    (hote.startsWith("localhost") ? "http" : "https");

  return `${protocole}://${hote}`;
}
