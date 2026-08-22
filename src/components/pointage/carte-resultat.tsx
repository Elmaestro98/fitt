// Carte de resultat du kiosque, reprise de public/kios.png : photo, nom,
// bandeau de statut, jours restants.
//
// /!\ Le passage est TOUJOURS enregistre, meme abonnement expire (§9 : la
// salle doit rester ouverte). Cet ecran informe l'accueil, il ne bloque
// personne. D'ou "Abonnement expire" plutot que "Acces refuse" : ecrire un
// refus que le logiciel n'applique pas serait un mensonge d'interface.
import { AlertTriangle, CheckCircle2, WifiOff } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { joursRestants } from "@/lib/utils/duree";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type ResultatPointage = {
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
    statut: string;
    finLe: Date | string | null;
  };
  /** true tant que le passage n'a pas ete acquitte par le serveur. */
  enAttente: boolean;
};

export function CarteResultat({ resultat }: { resultat: ResultatPointage }) {
  const { adherent, enAttente } = resultat;

  const fin = adherent.finLe ? new Date(adherent.finLe) : null;
  const restants = fin ? joursRestants(fin) : null;

  const couvert =
    adherent.statut === "ACTIF" && restants !== null && restants > 0;
  const suspendu = adherent.statut === "SUSPENDU";

  const bandeau = suspendu
    ? { libelle: "Compte suspendu", classe: "bg-danger text-white" }
    : couvert
      ? { libelle: "Acces autorise", classe: "bg-success text-white" }
      : { libelle: "Abonnement expire", classe: "bg-danger text-white" };

  return (
    <div
      className={cn(
        "rounded-card border-2 bg-surface p-5 sm:p-6",
        // Le resultat SURGIT : c'est la reponse a un geste (badge scanne,
        // nom tape), et l'accueil doit voir au coin de l'oeil que l'ecran a
        // change. Une carte qui se contente de remplacer la precedente sans
        // mouvement passe totalement inapercue quand on ne regarde pas.
        "animate-surgir shadow-souleve",
        couvert && !suspendu ? "border-success" : "border-danger",
      )}
      // Le staff ne regarde pas toujours l'ecran : le lecteur d'ecran et les
      // technologies d'assistance doivent annoncer le resultat.
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <Avatar
          nom={`${adherent.prenom} ${adherent.nom}`}
          photoUrl={adherent.photoUrl}
          taille="xl"
        />

        <div className="min-w-0 flex-1">
          {/* Le nom est le plus gros texte de tout le produit : lu a un
              metre de l'ecran, de biais, par quelqu'un qui tient deja un
              badge. Police display, interlettrage resserre. */}
          <p className="display truncate text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {adherent.prenom} {adherent.nom}
          </p>
          <p className="mt-0.5 font-mono text-sm text-muted">
            {adherent.numero}
          </p>

          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5",
              "text-sm font-semibold",
              bandeau.classe,
            )}
          >
            {couvert && !suspendu ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {bandeau.libelle}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
        {restants !== null && restants > 0 ? (
          <p className="text-ink">
            <strong className="font-semibold">{restants}</strong> jour
            {restants > 1 ? "s" : ""} restant{restants > 1 ? "s" : ""}
            {fin && (
              <span className="text-muted"> · jusqu&apos;au {formatDate(fin)}</span>
            )}
          </p>
        ) : (
          <p className="font-medium text-danger">
            {fin
              ? `Abonnement termine le ${formatDate(fin)}`
              : "Aucun abonnement en cours"}
          </p>
        )}

        {/* Le passage est deja acquis pour l'adherent : il n'attend que
            l'acquittement du serveur. On l'ecrit sans dramatiser. */}
        {enAttente && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <WifiOff className="size-3.5" />
            Passage enregistre, envoi des le retour du reseau
          </p>
        )}
      </div>
    </div>
  );
}
