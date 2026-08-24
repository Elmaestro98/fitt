"use client";

// Barre haute de l'espace adherent, pendant de components/layout/topbar.tsx.
//
// Quatre differences assumees avec celle du staff :
//   - pas de recherche : l'adherent a quatre pages, il n'a rien a chercher ;
//   - pas de UserButton Clerk : il n'a pas de compte Clerk et n'en aura
//     jamais (§5, §9). Sa "carte de membre" est son numero FITT-XXXX ;
//   - pas de selecteur de salle : il appartient a une seule salle (§4) ;
//   - pas de bouton hamburger : sous lg, la navigation vit dans
//     BarreOngletsEspace (barre du bas), pas dans un tiroir a ouvrir d'ici.
import { Avatar } from "@/components/ui/avatar";
import { BadgeStatut, type StatutAdherent } from "@/components/ui/badge";
import { BoutonDeconnexion } from "./bouton-deconnexion";

export function TopbarEspace({
  prenom,
  nom,
  numero,
  photoUrl,
  statut,
}: {
  prenom: string;
  nom: string;
  numero: string;
  photoUrl: string | null;
  statut: StatutAdherent;
}) {
  const nomComplet = `${prenom} ${nom}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <BadgeStatut statut={statut} />

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{nomComplet}</p>
            <p className="text-xs text-muted">{numero}</p>
          </div>

          <Avatar nom={nomComplet} photoUrl={photoUrl} taille="sm" />

          <BoutonDeconnexion compact />
        </div>
      </div>
    </header>
  );
}
