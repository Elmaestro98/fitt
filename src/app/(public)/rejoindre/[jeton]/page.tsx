// Page publique de pre-inscription : /rejoindre/<jeton>
//
// /!\ Segment volontairement distinct de /inscription, qui est le SignUp
// Clerk du staff — son catch-all [[...rest]] capturerait ce jeton.
//
// Aucun gymId n'apparait dans l'URL (§9). Ce qui s'y trouve est un secret de
// 32 octets dont seule l'empreinte est stockee : c'est lui, et lui seul, qui
// designe la salle.
import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { FormulairePreinscription } from "@/components/invitations/formulaire-preinscription";
import { verifierJeton } from "@/lib/data/invitation";

// Un lien d'inscription n'a rien a faire dans un moteur de recherche.
export const metadata: Metadata = {
  title: "Rejoindre une salle — Fitt",
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
      "Ce lien a depasse sa date de validite. Demandez-en un nouveau a votre salle.",
  },
  revoque: {
    titre: "Lien desactive",
    texte:
      "Ce lien a ete desactive par la salle. Contactez l'accueil pour vous inscrire.",
  },
  epuise: {
    titre: "Lien deja utilise",
    texte:
      "Ce lien a atteint son nombre maximal d'inscriptions. Demandez-en un nouveau a votre salle.",
  },
} as const;

export default async function PageRejoindre({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;

  // decodeURIComponent : le jeton est en base64url, mais un lien recopie a la
  // main peut arriver encode.
  const etat = await verifierJeton(decodeURIComponent(jeton));

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
    <FormulairePreinscription
      jeton={decodeURIComponent(jeton)}
      nomSalle={etat.gymNom}
    />
  );
}
