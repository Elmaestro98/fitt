// Les adherents qui paient sans venir (voir lib/data/decrochage.ts).
//
// Server Component : la seule interactivite est un lien wa.me, qui n'a besoin
// d'aucun JavaScript.
import Link from "next/link";
import { HeartPulse, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdherentQuiDecroche } from "@/lib/data/decrochage";
import { lienWhatsApp, messageReprise } from "@/lib/utils/whatsapp";

/** "35" -> "5 semaines". En semaines des qu'on depasse le seuil : "il y a
 *  5 semaines" se saisit d'un coup d'oeil, "il y a 35 jours" se calcule. */
function formaterAbsence(jours: number): string {
  const semaines = Math.floor(jours / 7);
  if (semaines >= 4) {
    const mois = Math.floor(jours / 30);
    if (mois >= 1) return `${mois} mois`;
  }
  return `${semaines} semaine${semaines > 1 ? "s" : ""}`;
}

export function AdherentsQuiDecrochent({
  adherents,
  nomSalle,
  total,
}: {
  adherents: AdherentQuiDecroche[];
  nomSalle: string;
  /** Total reel : la carte n'en affiche que les premiers. */
  total: number;
}) {
  return (
    <Card>
      <CardHeader
        titre="Ils ne viennent plus"
        icone={<HeartPulse className="size-4 text-brand" />}
        action={
          total > adherents.length ? (
            <Link
              href="/adherents"
              className="text-sm font-medium text-brand hover:underline"
            >
              Voir les {total}
            </Link>
          ) : undefined
        }
      />

      {adherents.length === 0 ? (
        // Etat vide volontairement positif : ici, "rien a afficher" est une
        // bonne nouvelle, pas un ecran a remplir.
        <EmptyState
          icone={<HeartPulse className="size-5" />}
          titre="Tout le monde vient encore"
          description="Aucun adherent a abonnement actif n'a disparu des radars. Continuez comme ca."
        />
      ) : (
      <CardBody className="pt-0">
        <p className="pb-3 text-sm text-muted">
          Abonnement actif, mais absents depuis un moment. Un mot suffit
          souvent a les faire revenir.
        </p>

        <ul className="divide-y divide-line">
          {adherents.map((adherent) => {
            const jamaisVenu = adherent.derniereVenue === null;

            return (
              <li
                key={adherent.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <Avatar
                  nom={`${adherent.prenom} ${adherent.nom}`}
                  photoUrl={adherent.photoUrl}
                  taille="sm"
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/adherents/${adherent.id}`}
                    className="block truncate font-medium text-ink hover:text-brand hover:underline"
                  >
                    {adherent.prenom} {adherent.nom}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {adherent.numero} ·{" "}
                    {jamaisVenu
                      ? "Jamais venu depuis son inscription"
                      : `Derniere venue il y a ${formaterAbsence(adherent.joursAbsence)}`}
                  </p>
                </div>

                <a
                  href={lienWhatsApp(
                    adherent.telephone,
                    messageReprise(adherent.prenom, nomSalle, jamaisVenu),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variante="whatsapp" taille="sm">
                    <Send className="size-4" />
                    <span className="hidden sm:inline">Prendre des nouvelles</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </Button>
                </a>
              </li>
            );
          })}
        </ul>
      </CardBody>
      )}
    </Card>
  );
}
