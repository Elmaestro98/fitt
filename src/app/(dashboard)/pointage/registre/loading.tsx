// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementRegistre() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-56 rounded-control squelette" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 rounded squelette" />
              <div className="h-7 w-16 rounded squelette" />
              <div className="h-3 w-32 rounded squelette" />
            </div>
          </Card>
        ))}
      </div>

      <div className="h-11 rounded-control squelette" />

      <Card className="divide-y divide-line">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <div className="h-3 w-10 shrink-0 rounded squelette" />
            <div className="size-8 shrink-0 rounded-full squelette" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded squelette" />
              <div className="h-3 w-16 rounded squelette" />
            </div>
            <div className="h-5 w-16 rounded-pill squelette" />
          </div>
        ))}
      </Card>
    </div>
  );
}
