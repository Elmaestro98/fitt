// Boutons de changement de statut. Chacun est un <form> qui appelle la Server
// Action : pas de fetch, pas de JSON, et ca fonctionne meme sans JavaScript.
import { Archive, Check, RotateCcw, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionChangerStatut } from "@/lib/actions/adherent";

export function ActionsStatut({
  id,
  statut,
}: {
  id: string;
  statut: string;
}) {
  const archive = statut === "ARCHIVE";
  const suspendu = statut === "SUSPENDU";
  const enAttente = statut === "EN_ATTENTE_VALIDATION";

  return (
    <div className="flex flex-col gap-2">
      {/* Une pre-inscription par lien n'est pas encore une adhesion (§4) :
          la premiere action possible est de la valider. */}
      {enAttente && (
        <BoutonStatut id={id} statut="ACTIF" variante="contour">
          <Check className="size-4" />
          Valider l&apos;inscription
        </BoutonStatut>
      )}

      {!enAttente && (suspendu || archive) ? (
        <BoutonStatut id={id} statut="ACTIF" variante="contour">
          <RotateCcw className="size-4" />
          Reactiver
        </BoutonStatut>
      ) : (
        <BoutonStatut id={id} statut="SUSPENDU" variante="danger">
          <Ban className="size-4" />
          Suspendre
        </BoutonStatut>
      )}

      {!archive && (
        <BoutonStatut id={id} statut="ARCHIVE" variante="fantome">
          <Archive className="size-4" />
          Archiver
        </BoutonStatut>
      )}
    </div>
  );
}

function BoutonStatut({
  id,
  statut,
  variante,
  children,
}: {
  id: string;
  statut: string;
  variante: "contour" | "danger" | "fantome";
  children: React.ReactNode;
}) {
  return (
    <form action={actionChangerStatut}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statut" value={statut} />
      <Button type="submit" variante={variante} taille="sm" className="w-full">
        {children}
      </Button>
    </form>
  );
}
