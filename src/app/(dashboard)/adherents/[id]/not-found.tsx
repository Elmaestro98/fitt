// Affiche par notFound(). Meme rendu qu'un id inexistant ou qu'un id
// appartenant a une autre salle : ne jamais reveler qu'une fiche existe
// ailleurs.
import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdherentIntrouvable() {
  return (
    <Card className="mx-auto max-w-lg">
      <EmptyState
        icone={<UserX className="size-5" />}
        titre="Adherent introuvable"
        description="Cette fiche n'existe pas, ou n'appartient pas a votre salle."
        action={
          <Link href="/adherents">
            <Button variante="contour">Retour a la liste</Button>
          </Link>
        }
      />
    </Card>
  );
}
