// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementAbonnements() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-44 rounded-control squelette" />
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="h-11 w-full max-w-xs rounded-control squelette" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-pill squelette" />
          ))}
        </div>
      </div>
      <Card className="divide-y divide-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="size-8 shrink-0 rounded-full squelette" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded squelette" />
              <div className="h-3 w-24 rounded squelette" />
            </div>
            <div className="hidden h-3 w-32 rounded squelette sm:block" />
            <div className="h-6 w-20 rounded-pill squelette" />
          </div>
        ))}
      </Card>
    </div>
  );
}
