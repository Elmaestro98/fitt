import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CarteFormule } from "@/components/formules/carte-formule";
import { listerFormules } from "@/lib/data/formule";

export const metadata = { title: "Formules — Fitt" };

export default async function PageFormules() {
  // On affiche aussi les archivees : le gerant doit pouvoir les retrouver
  // et les reactiver, et comprendre pourquoi un ancien abonnement les cite.
  const formules = await listerFormules({ inclureArchivees: true });
  const actives = formules.filter((f) => f.actif).length;

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Formules"
        sousTitre={
          formules.length === 0
            ? "Les offres que vos adherents peuvent souscrire"
            : `${actives} formule${actives > 1 ? "s" : ""} active${actives > 1 ? "s" : ""} sur ${formules.length}`
        }
        action={
          <Link href="/formules/nouvelle">
            <Button>
              <Plus className="size-4" />
              Nouvelle formule
            </Button>
          </Link>
        }
      />

      {formules.length === 0 ? (
        <Card>
          <EmptyState
            icone={<Tag className="size-5" />}
            titre="Aucune formule"
            description="Creez vos offres : mensuel, trimestriel, annuel... Elles seront proposees a la souscription d'un abonnement."
            action={
              <Link href="/formules/nouvelle">
                <Button>
                  <Plus className="size-4" />
                  Nouvelle formule
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="cascade grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {formules.map((f) => (
            <CarteFormule key={f.id} formule={f} />
          ))}
        </div>
      )}
    </div>
  );
}
