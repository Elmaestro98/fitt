// Televersement de fichiers vers Supabase Storage (CLAUDE.md §2).
//
// /!\ Contrairement au reste de lib/data/*, ces fonctions ne resolvent PAS
// le tenant via getTenantContext() : elles sont aussi appelees depuis le
// parcours PUBLIC de pre-inscription (§4), qui n'a pas de session Clerk. Le
// gymId leur est donc toujours passe en parametre, deja verifie par
// l'appelant (session staff, ou jeton de lien d'inscription pour le public).
import "server-only";

import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";

const BUCKET = "photos-adherents";
const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo — largement assez pour une photo de profil, peu pour un telephone en 4G faible.

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class PhotoInvalideError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoInvalideError";
  }
}

/**
 * Valide et televerse une photo de profil d'adherent, renvoie son URL
 * publique (le bucket est public : une photo de profil n'est pas une donnee
 * sensible, et Avatar l'affiche directement via <Image src=...>).
 *
 * Le nom de fichier est un identifiant aleatoire — jamais le nom d'origine
 * (peut contenir n'importe quoi), jamais l'id de l'adherent : cet appel a
 * lieu AVANT sa creation en base, pour ne pas garder une transaction Prisma
 * ouverte pendant un appel reseau externe.
 */
export async function televerserPhotoAdherent(
  gymId: string,
  fichier: File,
): Promise<string> {
  if (fichier.size === 0) {
    throw new PhotoInvalideError("Choisissez une photo.");
  }
  if (fichier.size > TAILLE_MAX) {
    throw new PhotoInvalideError("La photo depasse 5 Mo.");
  }
  const extension = EXTENSIONS[fichier.type];
  if (!extension) {
    throw new PhotoInvalideError(
      "Format non reconnu (JPEG, PNG ou WEBP attendu).",
    );
  }

  const chemin = `${gymId}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, fichier, { contentType: fichier.type, upsert: false });

  if (error) {
    throw new PhotoInvalideError("L'envoi de la photo a echoue. Reessayez.");
  }

  return supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
}
