// Les pre-inscriptions qui attendent la validation du staff (§4).
//
// C'est l'ecran qui fait tenir la regle : une personne inscrite par lien
// n'est pas adherente tant que la salle ne l'a pas dit. Tant qu'elle est ici,
// elle n'apparait dans aucun compteur d'adherents actifs.
import Link from "next/link";
import { Check, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { actionChangerStatut } from "@/lib/actions/adherent";
import { formaterTelephone } from "@/lib/utils/telephone";
import { formatDate } from "@/lib/utils/format";

type Demande = {
  id: string;
  numero: string;
  prenom: string;
  nom: string;
  telephone: string;
  photoUrl: string | null;
  creeLe: Date;
  lienInscription: { libelle: string } | null;
};

export function DemandesEnAttente({ demandes }: { demandes: Demande[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        titre="Demandes a valider"
        icone={<UserPlus className="size-4 text-brand" />}
        action={
          demandes.length > 0 ? (
            <span className="rounded-pill bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
              {demandes.length} en attente
            </span>
          ) : undefined
        }
      />

      {demandes.length === 0 ? (
        <EmptyState
          icone={<Check className="size-5" />}
          titre="Rien a valider"
          description="Les inscriptions faites par lien apparaitront ici avant d'entrer dans votre fichier."
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {demandes.map((d) => {
              const nomComplet = `${d.prenom} ${d.nom}`;

              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <Avatar
                    nom={nomComplet}
                    photoUrl={d.photoUrl}
                    taille="md"
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/adherents/${d.id}`}
                      className="block truncate font-medium text-ink hover:underline"
                    >
                      {nomComplet}
                    </Link>
                    <p className="text-xs text-muted">
                      {formaterTelephone(d.telephone)} · {d.numero} ·{" "}
                      {formatDate(d.creeLe)}
                      {d.lienInscription && ` · ${d.lienInscription.libelle}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/adherents/${d.id}`}>
                      <Button variante="contour" taille="sm">
                        Verifier
                      </Button>
                    </Link>

                    {/* Valider = passer en ACTIF. Le formulaire appelle la
                        Server Action existante, avec sa liste blanche. */}
                    <form action={actionChangerStatut}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="statut" value="ACTIF" />
                      <Button type="submit" taille="sm">
                        <Check className="size-4" />
                        Valider
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>

          <CardBody className="pt-4">
            <p className="text-xs text-muted">
              Verifiez le numero de telephone avant de valider : c&apos;est lui
              qui identifie l&apos;adherent dans la salle.
            </p>
          </CardBody>
        </>
      )}
    </Card>
  );
}
