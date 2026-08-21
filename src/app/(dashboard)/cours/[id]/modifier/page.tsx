import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaireSession } from "@/components/cours/formulaire-session";
import { actionModifierSessionCours } from "@/lib/actions/session-cours";
import { trouverSessionCours } from "@/lib/data/session-cours";
import { listerCoachs } from "@/lib/data/coach";
import { listerTypesCours } from "@/lib/data/type-cours";

export const metadata = { title: "Modifier une seance — Fitt" };

export default async function PageModifierSession({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await trouverSessionCours(id);
  if (!session) notFound();

  // Une seance qui n'est plus planifiee ne se modifie plus : on renvoie a sa
  // fiche, qui n'affiche de toute facon plus de lien "Modifier" dans ce cas.
  if (session.statut !== "PLANIFIEE") {
    redirect(`/cours/${session.id}`);
  }

  // Le type de cours et le coach actuels doivent apparaitre dans les
  // options meme s'ils ont ete archives entre-temps : sinon le formulaire
  // les ferait disparaitre silencieusement au premier enregistrement.
  const [typesCoursActifs, coachsActifs] = await Promise.all([
    listerTypesCours(),
    listerCoachs(),
  ]);
  const typesCours = typesCoursActifs.some((t) => t.id === session.typeCoursId)
    ? typesCoursActifs
    : [
        {
          id: session.typeCoursId,
          nom: `${session.typeCours.nom} (archive)`,
          dureeMinutes: session.dureeMinutes,
          capaciteDefaut: session.capacite,
        },
        ...typesCoursActifs,
      ];
  const coachs = coachsActifs.some((c) => c.id === session.coachId)
    ? coachsActifs
    : [
        {
          id: session.coachId,
          prenom: session.coach.prenom,
          nom: `${session.coach.nom} (archive)`,
        },
        ...coachsActifs,
      ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/cours/${session.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Retour a la seance
      </Link>

      <PageHeader titre={session.typeCours.nom} sousTitre="Modifier la seance" />

      <FormulaireSession
        action={actionModifierSessionCours.bind(null, session.id)}
        typesCours={typesCours}
        coachs={coachs}
        valeurs={{
          typeCoursId: session.typeCoursId,
          coachId: session.coachId,
          debutLe: session.debutLe,
          dureeMinutes: session.dureeMinutes,
          capacite: session.capacite,
        }}
        libelleSoumission="Enregistrer les modifications"
        placesReserveesMin={session.placesReservees}
        lienRetour={`/cours/${session.id}`}
      />
    </div>
  );
}
