// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementInvitations() {
  return (
    <div className="space-y-5">
      <div className="h-4 w-40 rounded squelette" />
      <div className="h-8 w-56 rounded-control squelette" />

      {/* Demandes a valider */}
      <Card className="divide-y divide-line">
        <div className="h-14" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="size-10 shrink-0 rounded-full squelette" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded squelette" />
              <div className="h-3 w-56 rounded squelette" />
            </div>
            <div className="h-9 w-24 rounded-control squelette" />
          </div>
        ))}
      </Card>

      {/* Formulaire de generation */}
      <Card>
        <div className="space-y-4 p-5">
          <div className="h-4 w-52 rounded squelette" />
          <div className="h-11 w-full rounded-control squelette" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-11 rounded-control squelette" />
            <div className="h-11 rounded-control squelette" />
          </div>
          <div className="h-11 w-40 rounded-control squelette" />
        </div>
      </Card>

      {/* Liens existants */}
      <Card className="divide-y divide-line">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 rounded squelette" />
              <div className="h-3 w-24 rounded squelette" />
            </div>
            <div className="h-6 w-16 rounded-pill squelette" />
            <div className="h-3 w-20 rounded squelette" />
          </div>
        ))}
      </Card>
    </div>
  );
}
