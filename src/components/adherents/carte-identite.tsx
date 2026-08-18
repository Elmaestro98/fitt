// Colonne de gauche de la fiche : identite, contact, actions.
import { Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BadgeStatut, type StatutAdherent } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { formaterTelephone } from "@/lib/utils/telephone";
import { formatDate, formatDateLongue } from "@/lib/utils/format";

const PASTILLE = {
  ACTIF: "actif",
  EXPIRE: "expire",
  SUSPENDU: "suspendu",
} as const;

const SEXE = { HOMME: "Homme", FEMME: "Femme" } as const;

type Adherent = {
  prenom: string;
  nom: string;
  numero: string;
  statut: string;
  photoUrl: string | null;
  telephone: string;
  email: string | null;
  adresse: string | null;
  sexe: string | null;
  dateNaissance: Date | null;
  creeLe: Date;
};

export function CarteIdentite({ adherent }: { adherent: Adherent }) {
  const nomComplet = `${adherent.prenom} ${adherent.nom}`;

  return (
    <Card>
      <CardBody className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar
            nom={nomComplet}
            photoUrl={adherent.photoUrl}
            taille="xl"
            statut={PASTILLE[adherent.statut as keyof typeof PASTILLE]}
          />
          <h2 className="mt-3 text-lg font-bold text-ink">{nomComplet}</h2>
          <p className="font-mono text-xs text-muted">{adherent.numero}</p>
          <div className="mt-2">
            <BadgeStatut statut={adherent.statut as StatutAdherent} />
          </div>
        </div>

        <dl className="mt-6 space-y-3 border-t border-line pt-5">
          <Info icone={<Phone className="size-4" />} label="Telephone">
            {/* tel: permet d'appeler en un clic depuis le telephone de
                l'accueil — c'est le principal usage du back-office. */}
            <a
              href={`tel:${adherent.telephone}`}
              className="font-medium text-ink hover:text-brand"
            >
              {formaterTelephone(adherent.telephone)}
            </a>
          </Info>

          {adherent.email && (
            <Info icone={<Mail className="size-4" />} label="E-mail">
              <a
                href={`mailto:${adherent.email}`}
                className="break-all text-ink hover:text-brand"
              >
                {adherent.email}
              </a>
            </Info>
          )}

          {adherent.adresse && (
            <Info icone={<MapPin className="size-4" />} label="Adresse">
              {adherent.adresse}
            </Info>
          )}

          {adherent.sexe && (
            <Info icone={<User className="size-4" />} label="Sexe">
              {SEXE[adherent.sexe as keyof typeof SEXE]}
            </Info>
          )}

          {adherent.dateNaissance && (
            <Info icone={<Calendar className="size-4" />} label="Naissance">
              {formatDateLongue(adherent.dateNaissance)}
            </Info>
          )}

          <Info icone={<Calendar className="size-4" />} label="Inscrit le">
            {formatDate(adherent.creeLe)}
          </Info>
        </dl>
      </CardBody>
    </Card>
  );
}

function Info({
  icone,
  label,
  children,
}: {
  icone: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control bg-sunken text-muted">
        {icone}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="text-sm text-ink">{children}</dd>
      </div>
    </div>
  );
}
