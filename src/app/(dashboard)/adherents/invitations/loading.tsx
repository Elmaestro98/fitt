// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementInvitations() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-4 w-40 rounded bg-sunken" />
      <div className="h-8 w-56 rounded-control bg-sunken" />

      {/* Demandes a valider */}
      <Card className="divide-y divide-line">
        <div className="h-14" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="size-10 shrink-0 rounded-full bg-sunken" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-sunken" />
              <div className="h-3 w-56 rounded bg-sunken" />
            </div>
            <div className="h-9 w-24 rounded-control bg-sunken" />
          </div>
        ))}
      </Card>

      {/* Formulaire de generation */}
      <Card>
        <div className="space-y-4 p-5">
          <div className="h-4 w-52 rounded bg-sunken" />
          <div className="h-11 w-full rounded-control bg-sunken" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-11 rounded-control bg-sunken" />
            <div className="h-11 rounded-control bg-sunken" />
          </div>
          <div className="h-11 w-40 rounded-control bg-sunken" />
        </div>
      </Card>

      {/* Liens existants */}
      <Card className="divide-y divide-line">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 rounded bg-sunken" />
              <div className="h-3 w-24 rounded bg-sunken" />
            </div>
            <div className="h-6 w-16 rounded-pill bg-sunken" />
            <div className="h-3 w-20 rounded bg-sunken" />
          </div>
        ))}
      </Card>
    </div>
  );
}
