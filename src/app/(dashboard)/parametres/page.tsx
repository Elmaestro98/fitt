// Parametres de la salle.
//
// Server Component : la salle est resolue par getTenantContext, jamais par un
// identifiant d'URL (§3). Il n'existe aucun moyen d'ouvrir les parametres
// d'une autre salle.
import { CalendarClock, Users } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CarteAVenir } from "@/components/ui/carte-a-venir";
import { PageHeader } from "@/components/layout/page-header";
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
