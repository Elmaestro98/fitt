// L'historique des commandes de l'adherent.
//
// Une commande n'est jamais supprimee, meme annulee (§9) : elle reste ici,
// marquee, pour que l'adherent comprenne ce qui s'est passe plutot que de
// voir une ligne disparaitre sans explication.
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BadgeStatutCommande, type StatutCommande } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { mesCommandesEspace } from "@/lib/data/espace-boutique";
import { actionAnnulerMaCommande } from "@/lib/actions/espace-boutique";
import { totalCommande } from "@/lib/utils/commande";
import { formatDateHeure, formatFCFA } from "@/lib/utils/format";

export const metadata = { title: "Mes commandes — Fitt" };

export default async function PageMesCommandes() {
  const commandes = await mesCommandesEspace();

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Mes commandes"
        sousTitre="A regler et a recuperer a la salle"
        action={
          <Link href="/espace/boutique">
            <Button variante="contour">Aller a la boutique</Button>
          </Link>
        }
      />

      {commandes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icone={<Receipt className="size-6" />}
              titre="Aucune commande"
              description="Ce que vous commandez dans la boutique apparait ici."
              action={
                <Link href="/espace/boutique">
                  <Button>Aller a la boutique</Button>
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {commandes.map((commande) => (
            <Card key={commande.id}>
              <CardBody className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {formatFCFA(totalCommande(commande.lignes))}
                    </p>
                    <p className="text-xs text-muted">
                      Commandee le {formatDateHeure(commande.creeLe)}
                    </p>
                  </div>
                  <BadgeStatutCommande
                    statut={commande.statut as StatutCommande}
                  />
                </div>

                <ul className="space-y-1 border-t border-line pt-3 text-sm">
                  {commande.lignes.map((ligne) => (
                    <li key={ligne.id} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-ink">
                        {ligne.quantite} × {ligne.nomProduit}
                      </span>
                      <span className="shrink-0 text-muted tabular-nums">
                        {formatFCFA(ligne.prixUnitaire * ligne.quantite)}
                      </span>
                    </li>
                  ))}
                </ul>

                {commande.statut === "PRETE" && (
                  <p className="rounded-control bg-info-soft px-3 py-2 text-sm text-ink/80">
                    Votre commande est prete. Passez la recuperer et la regler
                    a l&apos;accueil.
                  </p>
                )}

                {commande.statut === "RECUPEREE" && commande.recupereeLe && (
                  <p className="text-xs text-muted">
                    Recuperee le {formatDateHeure(commande.recupereeLe)}
                  </p>
                )}

                {commande.statut === "ANNULEE" && (
                  <p className="text-xs text-muted">
                    Annulee
                    {commande.annuleeLe
                      ? ` le ${formatDateHeure(commande.annuleeLe)}`
                      : ""}
                    {commande.motifAnnul ? ` — ${commande.motifAnnul}` : ""}
                  </p>
                )}

                {commande.note && (
                  <p className="text-xs text-muted">
                    Message de la salle : {commande.note}
                  </p>
                )}

                {/* Annulable seulement tant que la salle n'a rien prepare. */}
                {commande.statut === "EN_ATTENTE" && (
                  <form
                    action={actionAnnulerMaCommande}
                    className="border-t border-line pt-3"
                  >
                    <input type="hidden" name="id" value={commande.id} />
                    <Button type="submit" variante="danger" taille="sm">
                      Annuler cette commande
                    </Button>
                  </form>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
