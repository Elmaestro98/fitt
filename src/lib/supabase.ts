// Client Supabase, cote serveur uniquement (CLAUDE.md §2 : "Fichiers |
// Supabase Storage").
//
// La cle service_role contourne les policies RLS : c'est volontaire, notre
// application n'utilise pas l'authentification Supabase (Clerk + sessions
// maison, §5), donc aucun "utilisateur Supabase" ne pourrait jamais satisfaire
// une policy. Le controle d'acces reste entierement dans notre code serveur.
//
// /!\ Ne JAMAIS importer ce fichier depuis un composant client : la cle
// service_role donnerait acces a TOUT le stockage, toutes salles confondues.
import "server-only";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
