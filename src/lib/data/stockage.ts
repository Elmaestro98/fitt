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

/* Un bucket par nature de contenu. Les deux sont PUBLICS : ni une photo de
   profil ni une photo de produit n'est une donnee sensible, et sans bucket
   public next/image ne peut pas les afficher (§6). */
const BUCKET_ADHERENTS = "photos-adherents";
const BUCKET_PRODUITS = "photos-produits";

/** 5 Mo — largement assez pour une photo, peu pour un telephone en 4G faible. */
const TAILLE_MAX = 5 * 1024 * 1024;

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
 * Valide et televerse une image, renvoie son URL publique.
 *
 * Le nom de fichier est un identifiant aleatoire — jamais le nom d'origine
 * (peut contenir n'importe quoi), jamais l'id de l'enregistrement : ces appels
 * ont lieu AVANT sa creation en base, pour ne pas garder une transaction
 * Prisma ouverte pendant un appel reseau externe.
 *
 * Le prefixe gymId dans le chemin n'est pas une securite — le bucket est
 * public — mais il garde le stockage lisible salle par salle.
 */
async function televerserImage(
  bucket: string,
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
    .from(bucket)
    .upload(chemin, fichier, { contentType: fichier.type, upsert: false });

  if (error) {
    throw new PhotoInvalideError("L'envoi de la photo a echoue. Reessayez.");
  }

  return supabase.storage.from(bucket).getPublicUrl(chemin).data.publicUrl;
}

/** Photo de profil d'un adherent. Les initiales restent le cas NORMAL :
 *  une salle qui saisit 300 adherents au carnet ne mettra pas 300 photos. */
export function televerserPhotoAdherent(gymId: string, fichier: File) {
  return televerserImage(BUCKET_ADHERENTS, gymId, fichier);
}

/** Photo d'un produit de la boutique. Facultative elle aussi : le catalogue
 *  affiche une icone par defaut tant qu'aucune image n'est fournie. */
export function televerserPhotoProduit(gymId: string, fichier: File) {
  return televerserImage(BUCKET_PRODUITS, gymId, fichier);
}
