import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  BadgeStatutCommande,
  type StatutCommande,
} from "@/components/ui/badge";
import { BoutonRemettre } from "@/components/commandes/bouton-remettre";
import { BoutonAnnulerCommande } from "@/components/commandes/bouton-annuler-commande";
import { actionMarquerPrete } from "@/lib/actions/commande";
import { totalCommande } from "@/lib/utils/commande";
import { formatDateHeure, formatFCFA } from "@/lib/utils/format";
import { formaterTelephone } from "@/lib/utils/telephone";

type Commande = {
  id: string;
  statut: string;
  creeLe: Date;
  recupereeLe: Date | null;
  annuleeLe: Date | null;
  motifAnnul: string | null;
  note: string | null;
  adherent: {
    id: string;
    numero: string;
    prenom: string;
    nom: string;
    telephone: string;
    photoUrl: string | null;
  };
  lignes: {
    id: string;
    nomProduit: string;
    prixUnitaire: number;
    quantite: number;
  }[];
};

export function CarteCommande({ commande }: { commande: Commande }) {
  const { adherent, lignes, statut } = commande;
  const nomComplet = `${adherent.prenom} ${adherent.nom}`;
  const total = totalCommande(lignes);
  const enCours = statut === "EN_ATTENTE" || statut === "PRETE";

  return (
    <Card>
      <CardBody className="space-y-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nom={nomComplet} photoUrl={adherent.photoUrl} />
            <div className="min-w-0">
              <Link
                href={`/adherents/${adherent.id}`}
                className="truncate font-medium text-ink hover:text-brand hover:underline"
              >
                {nomComplet}
              </Link>
              <p className="truncate text-xs text-muted">
                {adherent.numero} · {formaterTelephone(adherent.telephone)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <BadgeStatutCommande statut={statut as StatutCommande} />
            <p className="mt-1 text-xs text-muted">
              {formatDateHeure(commande.creeLe)}
            </p>
          </div>
        </div>

        <ul className="space-y-1 border-t border-line pt-3 text-sm">
          {lignes.map((ligne) => (
            <li key={ligne.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-ink">
                {ligne.quantite} × {ligne.nomProduit}
              </span>
              <span className="shrink-0 text-muted tabular-nums">
                {formatFCFA(ligne.prixUnitaire * ligne.quantite)}
              </span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-t border-line pt-2 font-semibold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatFCFA(total)}</span>
          </li>
        </ul>

        {statut === "RECUPEREE" && commande.recupereeLe && (
          <p className="text-xs text-muted">
            Remise le {formatDateHeure(commande.recupereeLe)} — encaissee dans
            le journal de caisse.
          </p>
        )}

        {statut === "ANNULEE" && (
          <p className="text-xs text-muted">
            Annulee
            {commande.annuleeLe
              ? ` le ${formatDateHeure(commande.annuleeLe)}`
              : ""}
            {commande.motifAnnul ? ` — ${commande.motifAnnul}` : ""}
          </p>
        )}

        {enCours && (
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            {statut === "EN_ATTENTE" && (
              <form action={actionMarquerPrete}>
                <input type="hidden" name="id" value={commande.id} />
                <Button type="submit" variante="contour" taille="sm">
                  <PackageCheck className="size-4" />
                  Marquer prete
                </Button>
              </form>
            )}

            <BoutonRemettre
              commandeId={commande.id}
              montant={total}
              nomAdherent={nomComplet}
            />

            <BoutonAnnulerCommande
              commandeId={commande.id}
              nomAdherent={nomComplet}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
