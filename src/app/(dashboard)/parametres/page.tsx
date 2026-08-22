// Parametres de la salle.
//
// Server Component : la salle est resolue par getTenantContext, jamais par un
// identifiant d'URL (§3). Il n'existe aucun moyen d'ouvrir les parametres
// d'une autre salle.
import { CalendarClock, Users } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CarteAVenir } from "@/components/ui/carte-a-venir";
import { PageHeader } from "@/components/layout/page-header";
import { BoutonInstallation } from "@/components/pwa/bouton-installation";
import { FormulaireSalle } from "@/components/parametres/formulaire-salle";
import { parametresSalle } from "@/lib/data/gym";
import { formatDateLongue, formatNumeroAdherent } from "@/lib/utils/format";

export const metadata = { title: "Parametres — Fitt" };

export default async function PageParametres() {
  const gym = await parametresSalle();

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Parametres"
        sousTitre="Informations de votre salle"
      />

      <FormulaireSalle
        nom={gym.nom}
        telephone={gym.telephone}
        adresse={gym.adresse}
        ville={gym.ville}
      />

      {/* Installation de l'application. La carte entiere disparait si le
          navigateur ne peut rien proposer ou si c'est deja fait : mieux vaut
          rien qu'un bouton mort. C'est ici, dans les parametres, que le gerant
          vient une fois — le jour ou il installe Fitt sur la tablette de
          l'accueil. */}
      <CarteInstallation />

      <Card>
        <CardHeader titre="Informations du compte" />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <Ligne
              icone={<CalendarClock className="size-4 text-muted" />}
              label="Salle creee le"
              valeur={formatDateLongue(gym.creeLe)}
            />
            <Ligne
              icone={<Users className="size-4 text-muted" />}
              label="Prochain numero d'adherent"
              valeur={formatNumeroAdherent(gym.dernierNumeroAdherent + 1)}
            />
          </dl>

          <p className="mt-4 text-xs text-muted">
            Le compteur de numeros ne redescend jamais : un numero libere
            n&apos;est pas reattribue, pour que l&apos;historique reste lisible.
          </p>
        </CardBody>
      </Card>

      <CarteAVenir
        titre="Equipe et roles"
        lot={1}
        hauteur="h-24"
        description="Inviter un manager, un receptionniste ou un coach, et definir ce que chacun peut voir. Gere pour l'instant depuis le selecteur de salle, dans votre organisation."
      />
    </div>
  );
}

/* Le composant client est isole dans son propre bloc : la page reste un
   Server Component, seul ce morceau part dans le navigateur. */
function CarteInstallation() {
  return (
    <Card>
      <CardHeader titre="Application" />
      <CardBody>
        <p className="text-sm text-muted">
          Installez Fitt sur la tablette de l&apos;accueil ou sur votre
          telephone : l&apos;application s&apos;ouvre en plein ecran, sans
          barre d&apos;adresse, et se lance depuis l&apos;ecran d&apos;accueil
          comme n&apos;importe quelle autre.
        </p>
        <BoutonInstallation className="mt-4" />
      </CardBody>
    </Card>
  );
}

function Ligne({
  icone,
  label,
  valeur,
}: {
  icone: React.ReactNode;
  label: string;
  valeur: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted">
        {icone}
        {label}
      </dt>
      <dd className="font-medium text-ink">{valeur}</dd>
    </div>
  );
}
