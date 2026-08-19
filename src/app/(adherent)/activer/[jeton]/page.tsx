// Activation de l'espace adherent : /activer/<jeton>
//
// /!\ La page VERIFIE le jeton mais ne le consomme PAS. La consommation est
// derriere un bouton, donc derriere un POST volontaire. Deux raisons, toutes
// deux concretes :
//   - l'invitation est a usage unique (§4), et l'apercu de lien que WhatsApp
//     genere visite l'URL avant que l'adherent ne clique. Consommer au
//     chargement, c'est bruler le lien avant qu'il n'arrive ;
//   - Next.js interdit d'ecrire un cookie pendant le rendu d'une page.
//
// Aucun gymId dans l'URL (§9) : ce qui s'y trouve est un secret de 32 octets
// dont seule l'empreinte est stockee. C'est lui, et lui seul, qui designe la
// salle et l'adherent.
import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { BoutonActivation } from "@/components/espace/bouton-activation";
import { verifierInvitation } from "@/lib/data/espace-adherent";

export const metadata: Metadata = {
  title: "Activer mon espace — Fitt",
  robots: { index: false, follow: false },
};

const MESSAGES = {
  introuvable: {
    titre: "Lien invalide",
    texte:
      "Ce lien n'existe pas. Verifiez que vous l'avez copie en entier, ou demandez-en un nouveau a votre salle.",
  },
  expire: {
    titre: "Lien expire",
    texte:
      "Ce lien a depasse sa date de validite. Demandez-en un nouveau a l'accueil de votre salle.",
  },
  revoque: {
    titre: "Lien desactive",
    texte:
      "Ce lien a ete annule par votre salle. Contactez l'accueil pour en recevoir un nouveau.",
  },
  utilise: {
    titre: "Lien deja utilise",
    texte:
      "Cet acces a deja ete active. Si vous avez change de telephone, demandez un nouveau lien a votre salle.",
  },
  statut: {
    titre: "Espace pas encore ouvert",
    texte:
      "Votre inscription doit d'abord etre validee par votre salle. Passez a l'accueil, ce sera rapide.",
  },
} as const;

export default async function PageActivation({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;

  // decodeURIComponent : le jeton est en base64url, mais un lien recopie a la
  // main peut arriver encode.
  const jetonClair = decodeURIComponent(jeton);
  const etat = await verifierInvitation(jetonClair);

  if (!etat.valide) {
    const message = MESSAGES[etat.raison];
    return (
      <Card>
        <CardBody className="pt-8 pb-8 text-center">
          <h1 className="font-semibold text-ink">{message.titre}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
            {message.texte}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-5 pt-8 pb-8">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-ink">
            Bonjour {etat.prenom}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
            {etat.gymNom} vous ouvre votre espace personnel. Vous y verrez votre
            abonnement, vos jours restants et vos seances.
          </p>
        </div>

        <BoutonActivation jeton={jetonClair} />

        <p className="text-center text-xs text-muted">
          Aucun mot de passe a retenir. Ce telephone restera connecte pendant
          90 jours.
        </p>
      </CardBody>
    </Card>
  );
}
