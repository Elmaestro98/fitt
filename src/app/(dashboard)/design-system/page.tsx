// Catalogue visuel des primitives. Page de travail, pas destinee au gerant.
// Elle sert a verifier d'un coup d'oeil qu'un composant tient dans tous ses etats.
import { Bell, CreditCard, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, BadgeStatut } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export const metadata = { title: "Design system — Fitt" };

export default function PageDesignSystem() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Design system</h1>
        <p className="mt-1 text-sm text-muted">
          Primitives relevees sur les maquettes du 18/08/2026.
        </p>
      </header>

      <Section titre="Couleurs">
        <div className="flex flex-wrap gap-3">
          <Pastille nom="brand" classe="bg-brand" valeur="#FF6B35" />
          <Pastille nom="sidebar" classe="bg-sidebar" valeur="#2D3133" />
          <Pastille nom="canvas" classe="bg-canvas border border-line" valeur="#F7F9FB" />
          <Pastille nom="sunken" classe="bg-sunken" valeur="#F2F4F6" />
          <Pastille nom="ink" classe="bg-ink" valeur="#191C1E" />
          <Pastille nom="success" classe="bg-success" valeur="#00AF79" />
          <Pastille nom="warning" classe="bg-warning" valeur="#F59E0B" />
          <Pastille nom="danger" classe="bg-danger" valeur="#BA1A1A" />
          <Pastille nom="wave" classe="bg-wave" valeur="#00AEEF" />
          <Pastille nom="orangemoney" classe="bg-orangemoney" valeur="#FF6600" />
          <Pastille nom="whatsapp" classe="bg-whatsapp" valeur="#25D366" />
        </div>
      </Section>

      <Section titre="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Users className="size-4" /> Nouvel adherent
          </Button>
          <Button variante="contour">
            <CreditCard className="size-4" /> Nouveau paiement
          </Button>
          <Button variante="fantome">
            <Bell className="size-4" /> Notifications
          </Button>
          <Button variante="whatsapp">
            <Send className="size-4" /> Rappel WhatsApp
          </Button>
          <Button variante="danger">Suspendre</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button taille="sm">Petit</Button>
          <Button taille="md">Moyen</Button>
          <Button taille="lg">Grand</Button>
          <Button disabled>Desactive</Button>
          <Button variante="whatsapp" disabled>
            Rappel WhatsApp (Lot 2)
          </Button>
        </div>
      </Section>

      <Section titre="Badges de statut">
        <div className="flex flex-wrap items-center gap-3">
          <BadgeStatut statut="ACTIF" />
          <BadgeStatut statut="EXPIRE" />
          <BadgeStatut statut="SUSPENDU" />
          <BadgeStatut statut="EN_ATTENTE_VALIDATION" />
          <BadgeStatut statut="ARCHIVE" />
        </div>
        <p className="mt-3 text-sm text-muted">
          Formules d&apos;abonnement :
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Badge ton="info">Mensuel</Badge>
          <Badge ton="neutre">Annuel</Badge>
          <Badge ton="succes">Paye</Badge>
          <Badge ton="danger">Impaye</Badge>
        </div>
      </Section>

      <Section titre="Avatars">
        <div className="flex flex-wrap items-end gap-5">
          <Avatar nom="Moussa Diop" taille="sm" />
          <Avatar nom="Awa Ndiaye" taille="md" />
          <Avatar nom="Fatou Sow" taille="lg" statut="actif" />
          <Avatar nom="Ousmane Ndiaye" taille="xl" statut="expire" />
          <Avatar nom="Ibrahima Sy" taille="lg" statut="suspendu" />
        </div>
        <p className="mt-3 text-sm text-muted">
          Sans photo, les initiales prennent une teinte deterministe : le meme
          adherent garde toujours la meme couleur.
        </p>
      </Section>

      <Section titre="Cartes">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader
              titre="Abonnements expirant bientot"
              action={
                <a href="#" className="text-sm font-medium text-brand">
                  Voir tout
                </a>
              }
            />
            <CardBody>
              <p className="text-sm text-muted">
                Bordure fine plutot qu&apos;ombre portee — c&apos;est le choix
                de tes maquettes.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="pt-5">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                Adherents actifs
              </p>
              <p className="mt-2 text-3xl font-bold text-ink">1 240</p>
              <p className="mt-1 text-sm text-success">+5 % ce mois</p>
            </CardBody>
          </Card>
        </div>
      </Section>
    </main>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
        {titre}
      </h2>
      {children}
    </section>
  );
}

function Pastille({
  nom,
  classe,
  valeur,
}: {
  nom: string;
  classe: string;
  valeur: string;
}) {
  return (
    <div className="w-28">
      <div className={`h-14 rounded-card ${classe}`} />
      <p className="mt-1.5 text-xs font-medium text-ink">{nom}</p>
      <p className="font-mono text-[11px] text-muted">{valeur}</p>
    </div>
  );
}
