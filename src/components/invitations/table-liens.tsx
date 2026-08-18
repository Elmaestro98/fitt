// Liste des liens d'inscription generes par la salle.
//
// Le lien lui-meme n'y figure pas, et ne peut pas y figurer : seule son
// empreinte est stockee (§9). On affiche donc son etat, pas sa valeur.
import { Ban, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { actionRevoquerLien } from "@/lib/actions/invitation";
import { formatDate } from "@/lib/utils/format";

type Lien = {
  id: string;
  libelle: string;
  expireLe: Date;
  revoqueLe: Date | null;
  usagesMax: number | null;
  usages: number;
  creeLe: Date;
  _count: { adherents: number };
};

/** Etat courant du lien, dans l'ordre de priorite d'affichage. */
function etat(lien: Lien) {
  if (lien.revoqueLe) return { libelle: "Revoque", ton: "neutre" } as const;
  if (lien.expireLe < new Date())
    return { libelle: "Expire", ton: "neutre" } as const;
  if (lien.usagesMax !== null && lien.usages >= lien.usagesMax)
    return { libelle: "Epuise", ton: "neutre" } as const;
  return { libelle: "Actif", ton: "succes" } as const;
}

export function TableLiens({ liens }: { liens: Lien[] }) {
  if (liens.length === 0) {
    return (
      <EmptyState
        icone={<Link2 className="size-5" />}
        titre="Aucun lien genere"
        description="Un lien d'inscription permet a vos adherents de saisir eux-memes leurs informations. Vous validez ensuite chaque demande."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <Th>Nom</Th>
            <Th>Etat</Th>
            <Th>Utilisations</Th>
            <Th>Expire le</Th>
            <th className="w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {liens.map((lien) => {
            const e = etat(lien);
            const actif = e.libelle === "Actif";

            return (
              <tr key={lien.id} className="transition-colors hover:bg-canvas">
                <td className="px-5 py-3">
                  <span className="font-medium text-ink">{lien.libelle}</span>
                  <span className="block text-xs text-muted">
                    cree le {formatDate(lien.creeLe)}
                  </span>
                </td>

                <td className="px-5 py-3">
                  <Badge ton={e.ton}>{e.libelle}</Badge>
                </td>

                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {lien.usages}
                  {lien.usagesMax !== null ? ` / ${lien.usagesMax}` : " (illimite)"}
                  {lien._count.adherents > 0 && (
                    <span className="block text-xs">
                      {lien._count.adherents} fiche
                      {lien._count.adherents > 1 ? "s" : ""} creee
                      {lien._count.adherents > 1 ? "s" : ""}
                    </span>
                  )}
                </td>

                <td className="px-5 py-3 whitespace-nowrap text-muted">
                  {formatDate(lien.expireLe)}
                </td>

                <td className="px-5 py-3 text-right">
                  {/* Revoquer est immediat et definitif : un lien qui a fuite
                      doit pouvoir etre coupe sans delai (§4). */}
                  {actif && (
                    <form action={actionRevoquerLien}>
                      <input type="hidden" name="id" value={lien.id} />
                      <Button type="submit" variante="danger" taille="sm">
                        <Ban className="size-4" />
                        Revoquer
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase">
      {children}
    </th>
  );
}
