// Ecran affiche quand /espace est demande sans session valable.
//
// /!\ Cette page ne doit JAMAIS appeler exigerSessionAdherent() : c'est vers
// elle que la fonction redirige. Elle le ferait tourner en boucle.
//
// Aucun formulaire de connexion : il n'y a pas de mot de passe a saisir, et
// l'adherent ne peut pas s'ouvrir un acces lui-meme (§4). La seule issue est
// un lien envoye par sa salle — l'ecran le dit franchement plutot que de faire
// semblant.
//
// DEUX situations tres differentes aboutissent ici, et il serait faux de les
// confondre :
//   - aucun cookie      : la personne n'a jamais active d'espace, ou se
//                         promene simplement sur l'adresse. Lui annoncer une
//                         "expiration" serait un mensonge ;
//   - un cookie inutile : la session a bien existe, puis a expire, a ete
//                         fermee par la salle, ou l'adherent a ete archive.
//
// La presence du cookie suffit a les distinguer. Sa validite, elle, a deja ete
// verifiee en base par lireSessionAdherent — inutile d'y retourner ici.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { KeyRound, Smartphone } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { COOKIE_SESSION_ADHERENT } from "@/lib/session-adherent";

export const metadata: Metadata = {
  title: "Acces a mon espace — Fitt",
  robots: { index: false, follow: false },
};

export default async function PageAcces() {
  const sessionPerimee = (await cookies()).has(COOKIE_SESSION_ADHERENT);

  const contenu = sessionPerimee
    ? {
        icone: <KeyRound className="size-6 text-muted" />,
        titre: "Votre acces n'est plus valable",
        texte:
          "La connexion a votre espace dure 90 jours. Passe ce delai, ou si votre salle a ferme l'acces, il faut un nouveau lien.",
        detail:
          "Demandez-le a l'accueil de votre salle : il vous sera envoye par WhatsApp.",
      }
    : {
        icone: <Smartphone className="size-6 text-muted" />,
        titre: "Espace reserve aux adherents",
        texte:
          "Cet espace s'ouvre avec le lien personnel que votre salle vous envoie. Il n'y a ni compte a creer, ni mot de passe a retenir.",
        detail:
          "Vous etes adherent et n'avez pas recu de lien ? Demandez-le a l'accueil de votre salle.",
      };

  return (
    <Card>
      <CardBody className="space-y-4 py-10 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sunken">
          {contenu.icone}
        </span>

        <div>
          <h1 className="font-semibold text-ink">{contenu.titre}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
            {contenu.texte}
          </p>
        </div>

        <p className="mx-auto max-w-xs text-xs text-muted">{contenu.detail}</p>
      </CardBody>
    </Card>
  );
}
