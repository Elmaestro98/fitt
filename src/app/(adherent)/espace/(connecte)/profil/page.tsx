// Profil de l'adherent : ce que la salle a enregistre sur lui.
//
// En LECTURE SEULE, et c'est un choix, pas un manque. Le telephone porte
// l'unicite (gymId, telephone) et servira aux rappels WhatsApp du Lot 2 :
// laisser l'adherent le changer seul, c'est risquer qu'il se rende
// injoignable, ou qu'il prenne le numero deja enregistre de quelqu'un
// d'autre. Une correction passe par l'accueil, qui verifie.
import { CalendarClock, Phone, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BadgeStatut, type StatutAdherent } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { BoutonDeconnexion } from "@/components/espace/bouton-deconnexion";
import { BoutonInstallation } from "@/components/pwa/bouton-installation";
import { exigerSessionAdherent } from "@/lib/session-adherent";
import { formatDateLongue } from "@/lib/utils/format";
import { formaterTelephone } from "@/lib/utils/telephone";

export const metadata = { title: "Mon profil — Fitt" };

export default async function PageProfil() {
  const { adherent, gym, expireLe } = await exigerSessionAdherent();
  const nomComplet = `${adherent.prenom} ${adherent.nom}`;

  return (
    <div className="space-y-5">
      <PageHeader titre="Mon profil" sousTitre={gym.nom} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Avatar
              nom={nomComplet}
              photoUrl={adherent.photoUrl}
              taille="xl"
            />
            <p className="mt-4 text-lg font-semibold text-ink">{nomComplet}</p>
            {/* Le numero d'adherent est sa carte de membre : il l'annonce a
                l'accueil, il doit etre lisible du premier coup d'oeil (§8). */}
            <p className="mt-1 font-mono text-sm text-muted">
              {adherent.numero}
            </p>
            <div className="mt-3">
              <BadgeStatut statut={adherent.statut as StatutAdherent} />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader titre="Mes coordonnees" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Ligne
                  icone={<Phone className="size-4 text-muted" />}
                  label="Telephone"
                  valeur={formaterTelephone(adherent.telephone)}
                />
                <Ligne
                  icone={<Mail className="size-4 text-muted" />}
                  label="Salle"
                  valeur={`${gym.nom}${gym.ville ? ` — ${gym.ville}` : ""}`}
                />
              </dl>

              <p className="mt-4 rounded-control bg-sunken px-3 py-2 text-xs text-muted">
                Une information est incorrecte ? Signalez-le a l&apos;accueil de
                votre salle : c&apos;est l&apos;equipe qui met votre fiche a
                jour.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              titre="Ma connexion"
              icone={<ShieldCheck className="size-4 text-muted" />}
            />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Ligne
                  icone={<CalendarClock className="size-4 text-muted" />}
                  label="Cet appareil reste connecte jusqu'au"
                  valeur={formatDateLongue(expireLe)}
                />
              </dl>

              <p className="mt-4 text-xs text-muted">
                Aucun mot de passe n&apos;est associe a votre espace. Si vous
                changez de telephone, demandez un nouveau lien a votre salle.
                Deconnectez-vous si cet appareil ne vous appartient pas.
              </p>

              <div className="mt-4 flex justify-start">
                <BoutonDeconnexion />
              </div>
            </CardBody>
          </Card>

          {/* L'adherent ouvre son espace depuis un lien WhatsApp : sans
              installation, il doit retrouver ce message chaque fois. C'est
              precisement la population pour qui l'icone sur l'ecran
              d'accueil change tout. */}
          <Card>
            <CardHeader
              titre="Installer Fitt"
              icone={<Smartphone className="size-4 text-muted" />}
            />
            <CardBody>
              <p className="text-sm text-muted">
                Ajoutez Fitt a votre ecran d&apos;accueil pour ouvrir votre
                espace en un geste, sans rechercher le lien.
              </p>
              <BoutonInstallation className="mt-4" />
            </CardBody>
          </Card>
        </div>
      </div>
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icone}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="text-ink">{valeur}</dd>
      </div>
    </div>
  );
}
