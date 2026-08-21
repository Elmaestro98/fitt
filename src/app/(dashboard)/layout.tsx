// Habillage commun a tout le back-office : barre laterale + barre haute.
// Toute page placee dans (dashboard)/ en herite automatiquement.
//
// /!\ La resolution du tenant se fait ICI, une fois, plutot que de laisser
// chaque page planter independamment sur getTenantContext() (ce qu'elle
// faisait avant : un ecran d'erreur Next.js generique et illisible pour un
// gerant). getTenantContext() etant cache() (lib/tenant.ts), cet appel ne
// coute rien de plus : les pages qui l'appellent ensuite reutilisent le
// meme resultat pour la duree de la requete.
//
// La coquille (Sidebar + Topbar) reste TOUJOURS affichee, meme en echec :
// c'est dans la Topbar que vit le selecteur d'organisation Clerk, seul moyen
// pour un compte sans salle active d'en choisir ou d'en creer une.
import { Building2, Clock3, ShieldOff } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { notificationsStaff, type Notification } from "@/lib/data/notifications";
import {
  AucuneSalleActiveError,
  getTenantContext,
  SalleDesactiveeError,
  SalleIntrouvableError,
} from "@/lib/tenant";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let contenu = children;
  // Volontairement vides en cas d'echec : sans salle active, il n'y a aucune
  // donnee a lire, et la coquille doit quand meme s'afficher pour donner
  // acces au selecteur d'organisation.
  let notifications: Notification[] = [];

  try {
    await getTenantContext();
    ({ notifications } = await notificationsStaff());
  } catch (erreur) {
    contenu = <EcranBloque erreur={erreur} />;
  }

  return <AppShell notifications={notifications}>{contenu}</AppShell>;
}

function EcranBloque({ erreur }: { erreur: unknown }) {
  const { icone, titre, texte } =
    erreur instanceof AucuneSalleActiveError
      ? {
          icone: <Building2 className="size-6 text-muted" />,
          titre: "Choisissez votre salle",
          texte:
            "Utilisez le selecteur en haut de l'ecran pour rejoindre ou creer l'organisation de votre salle.",
        }
      : erreur instanceof SalleIntrouvableError
        ? {
            icone: <Clock3 className="size-6 text-muted" />,
            titre: "Initialisation en cours",
            texte: "Cette organisation vient d'etre creee, un instant.",
          }
        : erreur instanceof SalleDesactiveeError
          ? {
              icone: <ShieldOff className="size-6 text-muted" />,
              titre: "Acces non active",
              texte:
                "Cette salle n'a pas encore d'acces active, ou il a ete suspendu. Contactez AFRICATECHNOLOGIE pour l'activer.",
            }
          : {
              icone: <ShieldOff className="size-6 text-muted" />,
              titre: "Acces indisponible",
              texte: "Reessayez, ou contactez AFRICATECHNOLOGIE si ca persiste.",
            };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-sm">
        <CardBody className="space-y-3 py-10 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sunken">
            {icone}
          </span>
          <h1 className="font-semibold text-ink">{titre}</h1>
          <p className="text-sm text-muted">{texte}</p>
        </CardBody>
      </Card>
    </div>
  );
}
