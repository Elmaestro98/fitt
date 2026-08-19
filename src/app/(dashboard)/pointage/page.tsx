// Borne de pointage de la salle.
//
// Server Component : il prepare l'instantane (adherents + derniers passages)
// et le remet au kiosque, qui prend ensuite la main cote client. C'est ce
// transfert qui permet a la borne de survivre a une coupure reseau (§9).
import { CalendarCheck, TriangleAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/tableau-bord/stat-card";
import { Kiosque } from "@/components/pointage/kiosque";
import { CarteCodeSeance } from "@/components/pointage/carte-code-seance";
import {
  adherentsPourKiosque,
  derniersPassages,
  statistiquesPointage,
} from "@/lib/data/pointage";
import { codeSeanceDuJour } from "@/lib/data/gym";
import { synchroniserExpirations } from "@/lib/data/abonnement";

export const metadata = { title: "Pointage — Fitt" };

export default async function PagePointage() {
  // Les statuts echus sont remis a jour avant lecture : sans cela, la borne
  // afficherait "Acces autorise" a un abonnement termine hier.
  // Lot 2 : deplacer dans une tache planifiee quotidienne.
  await synchroniserExpirations();

  const [adherents, passages, stats, code] = await Promise.all([
    adherentsPourKiosque(),
    derniersPassages(),
    statistiquesPointage(),
    // Genere le code du jour s'il n'existe pas encore : c'est l'ouverture de
    // cette page, le matin, qui le fait exister.
    codeSeanceDuJour(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        titre="Pointage"
        sousTitre="Enregistrez les passages a l'entree"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Passages aujourd'hui"
          valeur={String(stats.passages)}
          icone={<CalendarCheck className="size-4" />}
          precision="depuis minuit"
        />
        <StatCard
          label="Adherents venus"
          valeur={String(stats.distincts)}
          icone={<Users className="size-4" />}
          teinte="success"
          precision="personnes distinctes"
        />
        <StatCard
          label="A regulariser"
          valeur={String(stats.expires)}
          icone={<TriangleAlert className="size-4" />}
          teinte="warning"
          precision="passages sans abonnement valide"
        />
      </div>

      <Kiosque adherents={adherents} passagesInitiaux={passages} />

      <CarteCodeSeance codeInitial={code} />

      <p className="text-xs text-muted">
        Les passages sont enregistres meme sans connexion : ils partent
        automatiquement des le retour du reseau. La salle n&apos;a jamais a
        attendre le serveur pour ouvrir la porte.
      </p>
    </div>
  );
}
